import React, { useMemo, useRef, useEffect, useState } from "react";

// Інтерполяція кольорів
function lerpColor(a, b, t) {
    const ah = a.replace("#", "");
    const bh = b.replace("#", "");
    const ar = parseInt(ah.substring(0, 2), 16);
    const ag = parseInt(ah.substring(2, 4), 16);
    const ab = parseInt(ah.substring(4, 6), 16);
    const br = parseInt(bh.substring(0, 2), 16);
    const bg = parseInt(bh.substring(2, 4), 16);
    const bb = parseInt(bh.substring(4, 6), 16);
    const rr = Math.round(ar + (br - ar) * t);
    const rg = Math.round(ag + (bg - ag) * t);
    const rb = Math.round(ab + (bb - ab) * t);
    return (
        "#" +
        rr.toString(16).padStart(2, "0") +
        rg.toString(16).padStart(2, "0") +
        rb.toString(16).padStart(2, "0")
    );
}

// Градації
const GRADATIONS = [
    { min: 0, max: 0 },    // Неактивно
    { min: 1, max: 4 },    // Слабко
    { min: 5, max: 9 },    // Помірно
    { min: 10, max: 19 },  // Інтенсивно
    { min: 20, max: Infinity }, // Активно
];
function getGradationIndex(count) {
    for (let i = 0; i < GRADATIONS.length; ++i) {
        if (count >= GRADATIONS[i].min && count <= GRADATIONS[i].max) return i;
    }
    return 0;
}
function getWeeksData({ weeks, startDayOfTheWeek }) {
    const today = new Date();
    const days = [];
    let lastDate = new Date(today); //Тут знахлдить останній день тижня
    lastDate.setHours(0, 0, 0, 0);
    const day = lastDate.getDay();
    const diff =
        ((day - startDayOfTheWeek + 7) % 7);
    lastDate.setDate(lastDate.getDate() - diff);

    for (let w = weeks - 1; w >= 0; --w) {
        for (let d = 0; d < 7; ++d) {
            const date = new Date(lastDate);
            date.setDate(lastDate.getDate() - w * 7 + d);
            days.push(new Date(date));
        }
    }
    return days;
}
// Повертання масив назв місяців для підпису
function getMonthLabels(days, startDayOfTheWeek) {
    const labels = [];
    let prevMonth = null;
    for (let i = 0; i < days.length; i += 7) {
        const date = days[i];
        const month = date.getMonth();
        if (month !== prevMonth) {
            labels.push({ index: i / 7, month });
            prevMonth = month;
        }
    }
    return labels;
}
const MONTHS_SHORT = [
    "Січ", "Лют", "Бер", "Кві", "Тра", "Чер",
    "Лип", "Сер", "Вер", "Жов", "Лис", "Гру"
];
const LEGEND_LABELS = ["0", "1-4", "5-9", "10-19", "20+"];
const WEEKDAYS_SHORT = [
    "Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"
];

// Основний компонент
export default function ActivityGraph({
    data,
    colors = { inactiveColor: "#ebedf0", activeColor: "#216e39" },
    startDayOfTheWeek = 0,
    width = 700,
    cellSize = 14,
    cellGap = 3,
    legend = true,
    adaptive = true,
}) {
    const containerRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(width);

    // Адаптивність
    useEffect(() => {
        if (!adaptive) return;
        function handleResize() {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth);
            }
        }
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [adaptive]);

    const weeks = useMemo(() => {
        return Math.min(
            52,
            Math.floor((containerWidth - 40) / (cellSize + cellGap))
        );
    }, [containerWidth, cellSize, cellGap]);

    const days = useMemo(
        () => getWeeksData({ weeks, startDayOfTheWeek }),
        [weeks, startDayOfTheWeek]
    );

    const activityMap = useMemo(() => {
        const map = {};
        for (const iso of data) {
            const d = new Date(iso);
            d.setHours(0, 0, 0, 0);
            const key = d.toISOString().slice(0, 10);
            map[key] = (map[key] || 0) + 1;
        }
        return map;
    }, [data]);
    const gradationColors = useMemo(() => {
        const arr = [colors.inactiveColor];
        arr.push(lerpColor(colors.inactiveColor, colors.activeColor, 0.25));
        arr.push(lerpColor(colors.inactiveColor, colors.activeColor, 0.5));
        arr.push(lerpColor(colors.inactiveColor, colors.activeColor, 0.75));
        arr.push(colors.activeColor);
        return arr;
    }, [colors]);

    const [prevColors, setPrevColors] = useState([]);
    useEffect(() => {
        setPrevColors(
            days.map((date) => {
                const key = date.toISOString().slice(0, 10);
                const count = activityMap[key] || 0;
                const idx = getGradationIndex(count);
                return gradationColors[idx];
            })
        );
    }, [data]);

    const monthLabels = useMemo(
        () => getMonthLabels(days, startDayOfTheWeek),
        [days, startDayOfTheWeek]
    );
    const svgHeight = cellSize * 7 + cellGap * 6 + 60;
    const getWeekdayLabel = (index) => {
        if (startDayOfTheWeek === 6) {
            return WEEKDAYS_SHORT[(index + 6) % 7];
        }
        return WEEKDAYS_SHORT[index];
    };

    const LEFT_PAD = 44;
    return (
        <div ref={containerRef} style={{ width: "100%", overflowX: "auto" }}>
            <svg
                width={weeks * (cellSize + cellGap) + LEFT_PAD + 4}
                height={svgHeight}
                style={{ display: "block", margin: "0 auto" }}
            >
                {/* Місяці */}
                {monthLabels.map((label) => (
                    <text
                        key={label.index}
                        x={LEFT_PAD + label.index * (cellSize + cellGap)}
                        y={15}
                        fontSize={12}
                        fill="#888"
                    >
                        {MONTHS_SHORT[label.month]}
                    </text>
                ))}
                {/* Дні тижня */}
                {[0, 2, 4, 6].map((d) => (
                    <text
                        key={d}
                        x={LEFT_PAD - 8}
                        y={40 + d * (cellSize + cellGap) + cellSize / 2}
                        fontSize={10}
                        fill="#888"
                        textAnchor="end"
                        alignmentBaseline="middle"
                    >
                        {getWeekdayLabel(d)}
                    </text>
                ))}
                {/* Клітинки */}
                {days.map((date, i) => {
                    const week = Math.floor(i / 7);
                    const day = i % 7;
                    const key = date.toISOString().slice(0, 10);
                    const count = activityMap[key] || 0;
                    const idx = getGradationIndex(count);
                    const color = gradationColors[idx];
                    const prevColor = prevColors[i] || color;
                    return (
                        <rect
                            key={key}
                            x={LEFT_PAD + week * (cellSize + cellGap)}
                            y={30 + day * (cellSize + cellGap)}
                            width={cellSize}
                            height={cellSize}
                            rx={3}
                            fill={color}
                            style={{
                                transition: "fill 0.5s",
                                fill: prevColor,
                                animation: prevColor !== color ? "colorFade 0.5s forwards" : undefined,
                                animationDelay: "0s",
                            }}
                            onAnimationEnd={e => {
                                e.target.style.fill = color;
                            }}
                        >
                            <title>
                                {key}: {count} активностей
                            </title>
                        </rect>
                    );
                })}
            </svg>
            {/* Легенда під таблицею */}
            <div style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginTop: 16,
                justifyContent: "center",
                flexWrap: "wrap"
            }}>
                {gradationColors.map((color, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{
                            width: cellSize,
                            height: cellSize,
                            background: color,
                            borderRadius: 3,
                            border: "1px solid #ccc",
                            marginRight: 4
                        }} />
                        <span style={{ fontSize: 13, color: "#888" }}>{LEGEND_LABELS[i]}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}