"use client";

import React, { useEffect, useId, useRef, useState } from "react";

interface MaterialShapeProps extends React.HTMLAttributes<HTMLDivElement> {
    name: string;
    outlined?: boolean;
    background?: string; // accepts any valid css background: color, currentColor, gradient, or url()
    strokeWidth?: number;
    size?: number | string;
    morphDuration?: number;
    morphEasing?: string;
}

interface ParsedSvg {
    viewBox: string;
    paths: string[];
}

interface Point {
    x: number;
    y: number;
}

interface CubicSegment {
    start: Point;
    control1: Point;
    control2: Point;
    end: Point;
}

interface ActiveTransition {
    from: CubicSegment[];
    to: CubicSegment[];
    startedAt: number;
    duration: number;
    easing: string;
}

const MORPH_SEGMENT_COUNT = 192;
const SVG_PATH_TOKEN = /[a-zA-Z]|[-+]?(?:(?:\d+\.?\d*)|(?:\.\d+))(?:[eE][-+]?\d+)?/g;
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const shapeCache = new Map<string, ParsedSvg>();
const shapeRequests = new Map<string, Promise<ParsedSvg>>();
const EASING_PRESETS: Record<string, [number, number, number, number]> = {
    linear: [0, 0, 1, 1],
    ease: [0.25, 0.1, 0.25, 1],
    "ease-in": [0.42, 0, 1, 1],
    "ease-out": [0, 0, 0.58, 1],
    "ease-in-out": [0.42, 0, 0.58, 1],
};

function getShapeUrl(name: string) {
    return `/material%20shapes/${encodeURIComponent(name)}.svg`;
}

function getShapeMaskUrl(name: string) {
    return `url("${getShapeUrl(name)}")`;
}

function loadShape(name: string): Promise<ParsedSvg> {
    const url = getShapeUrl(name);
    const cached = shapeCache.get(url);
    if (cached) return Promise.resolve(cached);

    const pending = shapeRequests.get(url);
    if (pending) return pending;

    const request = fetch(url)
        .then((response) => {
            if (!response.ok) throw new Error(`Could not load shape: ${url}`);
            return response.text();
        })
        .then((rawText) => {
            const doc = new DOMParser().parseFromString(rawText, "image/svg+xml");
            const svg = doc.querySelector("svg");
            if (!svg || doc.querySelector("parsererror")) {
                throw new Error(`Invalid SVG shape: ${url}`);
            }

            const viewBox =
                svg.getAttribute("viewBox") ||
                `0 0 ${svg.getAttribute("width") || 100} ${svg.getAttribute("height") || 100}`;
            const paths = Array.from(svg.querySelectorAll("path"))
                .map((path) => path.getAttribute("d"))
                .filter((path): path is string => Boolean(path));

            if (paths.length === 0) throw new Error(`Shape has no paths: ${url}`);

            const parsed = { viewBox, paths };
            shapeCache.set(url, parsed);
            return parsed;
        })
        .finally(() => shapeRequests.delete(url));

    shapeRequests.set(url, request);
    return request;
}

function createMaskImage(
    viewBox: string,
    paths: string[],
    outlined: boolean,
    strokeWidth: number
) {
    const pathTags = paths
        .map((path) => `<path
            d="${path}"
            fill="${outlined ? "none" : "white"}"
            stroke="${outlined ? "white" : "none"}"
            stroke-width="${outlined ? `${strokeWidth}px` : 0}"
            vector-effect="non-scaling-stroke"
            stroke-linejoin="round"
        />`)
        .join("");
    const svg = `<svg xmlns="${SVG_NAMESPACE}" viewBox="${viewBox}">${pathTags}</svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function parseClosedPath(shape: ParsedSvg): CubicSegment[] | null {
    const pathData = shape.paths[0];
    if (shape.paths.length !== 1 || !/[zZ]\s*$/.test(pathData)) return null;

    const [minX, minY, width, height] = shape.viewBox
        .trim()
        .split(/[\s,]+/)
        .map(Number);
    if (![minX, minY, width, height].every(Number.isFinite) || width <= 0 || height <= 0) {
        throw new Error(`Invalid SVG viewBox: ${shape.viewBox}`);
    }

    const tokens = pathData.match(SVG_PATH_TOKEN) || [];
    const unparsed = pathData.replace(SVG_PATH_TOKEN, "").replace(/[\s,]/g, "");
    if (unparsed) throw new Error(`Unsupported SVG path syntax: ${unparsed}`);

    let tokenIndex = 0;
    let command = "";
    let current: Point = { x: 0, y: 0 };
    let start: Point | null = null;
    let closed = false;
    const segments: CubicSegment[] = [];

    const readNumber = () => {
        const value = Number(tokens[tokenIndex++]);
        if (!Number.isFinite(value)) throw new Error("Invalid number in SVG path");
        return value;
    };

    const readPoint = (relative: boolean): Point => {
        const x = readNumber();
        const y = readNumber();
        return relative
            ? { x: current.x + x, y: current.y + y }
            : { x, y };
    };

    const addLine = (end: Point) => {
        const dx = (end.x - current.x) / 3;
        const dy = (end.y - current.y) / 3;
        segments.push({
            start: current,
            control1: { x: current.x + dx, y: current.y + dy },
            control2: { x: end.x - dx, y: end.y - dy },
            end,
        });
        current = end;
    };

    while (tokenIndex < tokens.length) {
        if (/^[a-zA-Z]$/.test(tokens[tokenIndex])) {
            command = tokens[tokenIndex++];
        } else if (!command) {
            throw new Error("SVG path is missing a command");
        }

        const relative = command === command.toLowerCase();
        const operation = command.toUpperCase();

		switch (operation) {
			case "Z":
				if (!start) throw new Error("SVG path closes before it starts");
				if (Math.hypot(current.x - start.x, current.y - start.y) > 1e-8) {
					addLine(start);
				}
				current = start;
				closed = true;
				command = "";
				continue;

			case "M":
				if (start) return null;
				current = readPoint(relative);
				start = current;
				command = relative ? "l" : "L";
				continue;

			case "L":
				addLine(readPoint(relative));
				continue;

			case "H":
				const x = readNumber();
				addLine({ x: relative ? current.x + x : x, y: current.y });
				continue;

			case "V":
				const y = readNumber();
				addLine({ x: current.x, y: relative ? current.y + y : y });
				continue;

			case "C":
				const origin = current;
				const control1 = readPoint(relative);
				const control2 = readPoint(relative);
				const end = readPoint(relative);
				segments.push({ start: origin, control1, control2, end });
				current = end;
				continue;

			default:
				throw new Error(`Unsupported SVG path command: ${command}`);
		}
    }

    if (!closed || segments.length === 0) return null;

    const scale = Math.min(width, height);
    const centerX = minX + width / 2;
    const centerY = minY + height / 2;
    const normalize = (point: Point): Point => ({
        x: .5 + (point.x - centerX) / scale,
        y: .5 + (point.y - centerY) / scale,
    });
    const normalizedSegments = segments.map((segment) => ({
        start: normalize(segment.start),
        control1: normalize(segment.control1),
        control2: normalize(segment.control2),
        end: normalize(segment.end),
    }));

    return subdivideToSegmentCount(normalizedSegments, MORPH_SEGMENT_COUNT);
}

function interpolatePoint(start: Point, end: Point, progress: number): Point {
    return {
        x: start.x + (end.x - start.x) * progress,
        y: start.y + (end.y - start.y) * progress,
    };
}

function cubicPoint(segment: CubicSegment, t: number): Point {
    const inverse = 1 - t;
    return {
        x:
            inverse ** 3 * segment.start.x +
            inverse ** 2 * 3 * t * segment.control1.x +
            inverse * 3 * t ** 2 * segment.control2.x +
            t ** 3 * segment.end.x,
        y:
            inverse ** 3 * segment.start.y +
            inverse ** 2 * 3 * t * segment.control1.y +
            inverse * 3 * t ** 2 * segment.control2.y +
            t ** 3 * segment.end.y,
    };
}

function approximateLength(segment: CubicSegment): number {
    let length = 0;
    let previous = segment.start;
    for (let index = 1; index <= 12; index++) {
        const point = cubicPoint(segment, index / 12);
        length += Math.hypot(point.x - previous.x, point.y - previous.y);
        previous = point;
    }
    return length;
}

function splitCubic(segment: CubicSegment, t: number): [CubicSegment, CubicSegment] {
    const startControl = interpolatePoint(segment.start, segment.control1, t);
    const controlEnd = interpolatePoint(segment.control1, segment.control2, t);
    const endControl = interpolatePoint(segment.control2, segment.end, t);
    const startEnd = interpolatePoint(startControl, controlEnd, t);
    const endStart = interpolatePoint(controlEnd, endControl, t);
    const middle = interpolatePoint(startEnd, endStart, t);

    return [
        {
            start: segment.start,
            control1: startControl,
            control2: startEnd,
            end: middle,
        },
        {
            start: middle,
            control1: endStart,
            control2: endControl,
            end: segment.end,
        },
    ];
}

function subdivideCubic(segment: CubicSegment, count: number): CubicSegment[] {
    const result: CubicSegment[] = [];
    let remaining = segment;
    for (let index = 0; index < count - 1; index++) {
        const [left, right] = splitCubic(remaining, 1 / (count - index));
        result.push(left);
        remaining = right;
    }
    result.push(remaining);
    return result;
}

function subdivideToSegmentCount(segments: CubicSegment[], count: number): CubicSegment[] {
    if (segments.length > count) {
        throw new Error(`SVG path has more than ${count} cubic segments`);
    }

    const extraCount = count - segments.length;
    if (extraCount === 0) return segments;

    const lengths = segments.map(approximateLength);
    const totalLength = lengths.reduce((sum, length) => sum + length, 0);
    if (!Number.isFinite(totalLength) || totalLength <= 0) {
        throw new Error("SVG path has no measurable length");
    }

    const allocations = lengths.map(() => 1);
    const remainders: { index: number; fraction: number }[] = [];
    let allocatedExtras = 0;
    lengths.forEach((length, index) => {
        const share = (length / totalLength) * extraCount;
        const whole = Math.floor(share);
        allocations[index] += whole;
        allocatedExtras += whole;
        remainders.push({ index, fraction: share - whole });
    });
    remainders.sort((a, b) => b.fraction - a.fraction);
    for (let index = 0; index < extraCount - allocatedExtras; index++) {
        allocations[remainders[index].index]++;
    }

    return segments.flatMap((segment, index) => subdivideCubic(segment, allocations[index]));
}

function reverseCubic(segment: CubicSegment): CubicSegment {
    return {
        start: segment.end,
        control1: segment.control2,
        control2: segment.control1,
        end: segment.start,
    };
}

function alignSegments(source: CubicSegment[], target: CubicSegment[]): CubicSegment[] {
    let bestCost = Number.POSITIVE_INFINITY;
    let bestOffset = 0;
    let bestReversed = false;

    for (const reversed of [false, true]) {
        for (let offset = 0; offset < target.length; offset++) {
            let cost = 0;
            for (let index = 0; index < source.length; index++) {
                const targetIndex = (offset + (reversed ? -index : index) + target.length) % target.length;
                const candidate = reversed
                    ? reverseCubic(target[targetIndex])
                    : target[targetIndex];
                const dx = source[index].start.x - candidate.start.x;
                const dy = source[index].start.y - candidate.start.y;
                cost += dx ** 2 + dy ** 2;
            }

            if (cost < bestCost) {
                bestCost = cost;
                bestOffset = offset;
                bestReversed = reversed;
            }
        }
    }

    return target.map((_, index) => {
        const targetIndex = (bestOffset + (bestReversed ? -index : index) + target.length) % target.length;
        return bestReversed ? reverseCubic(target[targetIndex]) : target[targetIndex];
    });
}

function cubicSegmentsToPath(segments: CubicSegment[], scale = 100) {
    const coordinate = ({ x, y }: Point) => `${(x * scale).toFixed(5)} ${(y * scale).toFixed(5)}`;
    const first = segments[0];
    return `M${coordinate(first.start)}${segments
        .map(
            (segment) => `C${coordinate(segment.control1)} ${coordinate(segment.control2)} ${coordinate(segment.end)}`
        )
        .join("")}Z`;
}

function interpolateSegments(
    from: CubicSegment[],
    to: CubicSegment[],
    progress: number
): CubicSegment[] {
    return from.map((segment, index) => ({
        start: interpolatePoint(segment.start, to[index].start, progress),
        control1: interpolatePoint(segment.control1, to[index].control1, progress),
        control2: interpolatePoint(segment.control2, to[index].control2, progress),
        end: interpolatePoint(segment.end, to[index].end, progress),
    }));
}

function getEasingProgress(progress: number, easing: string): number {
    const cubicBezierMatch = easing.match(
        /^cubic-bezier\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)$/
    );
    const controls = cubicBezierMatch
        ? cubicBezierMatch.slice(1).map(Number) as [number, number, number, number]
        : EASING_PRESETS[easing];

    if (!controls) return progress;

    const [x1, y1, x2, y2] = controls;
    const curve = (time: number, first: number, second: number) =>
        3 * (1 - time) ** 2 * time * first +
        3 * (1 - time) * time ** 2 * second +
        time ** 3;

    let low = 0;
    let high = 1;
    let parameter = progress;
    for (let iteration = 0; iteration < 12; iteration++) {
        parameter = (low + high) / 2;
        if (curve(parameter, x1, x2) < progress) low = parameter;
        else high = parameter;
    }

    return curve(parameter, y1, y2);
}

function setElementMask(element: HTMLDivElement, maskImage: string) {
    element.style.maskImage = maskImage;
    element.style.webkitMaskImage = maskImage;
}

export default function MaterialShape({
    name,
    outlined = false,
    background = "currentColor",
    strokeWidth = 2,
    size = 80,
    morphDuration = 400,
    morphEasing = "cubic-bezier(0.2, 0, 0, 1)",
    style,
    ...props
}: MaterialShapeProps) {
    const initialShape = shapeCache.get(getShapeUrl(name));
    const [maskImage, setMaskImage] = useState(() =>
        outlined
            ? initialShape
                ? createMaskImage(initialShape.viewBox, initialShape.paths, true, strokeWidth)
                : "none"
            : getShapeMaskUrl(name)
    );
    const [maskReady, setMaskReady] = useState(!outlined || Boolean(initialShape));
    const maskId = `material-shape-${useId().replace(/:/g, "")}`;
    const elementRef = useRef<HTMLDivElement>(null);
    const morphPathRef = useRef<SVGPathElement>(null);
    const previousNameRef = useRef(name);
    const currentShapeRef = useRef<{ name: string; data: ParsedSvg } | null>(
        initialShape ? { name, data: initialShape } : null
    );
    const currentSegmentsRef = useRef<CubicSegment[] | null>(null);
    const activeTransitionRef = useRef<ActiveTransition | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const transitionTimerRef = useRef<number | null>(null);

    useEffect(() => {
        const fromName = previousNameRef.current;
        const shouldMorph = fromName !== name;
        previousNameRef.current = name;
        let cancelled = false;

        if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (transitionTimerRef.current !== null) {
            window.clearTimeout(transitionTimerRef.current);
            transitionTimerRef.current = null;
        }

        const setFinalShape = (shape: ParsedSvg, segments: CubicSegment[] | null) => {
            const image = outlined
                ? createMaskImage(shape.viewBox, shape.paths, true, strokeWidth)
                : getShapeMaskUrl(name);
            currentShapeRef.current = { name, data: shape };
            currentSegmentsRef.current = segments;
            setMaskImage(image);
            setMaskReady(true);
        };

        const loadAndRender = async () => {
            try {
                const targetShape = await loadShape(name);
                if (cancelled) return;

                let targetSegments: CubicSegment[] | null = null;
                try {
                    targetSegments = parseClosedPath(targetShape);
                } catch (error) {
                    console.error(`Could not prepare shape "${name}" for morphing`, error);
                }

                if (!shouldMorph) {
                    setFinalShape(targetShape, targetSegments);
                    return;
                }

                let sourceSegments = currentSegmentsRef.current;
                if (!sourceSegments) {
                    const sourceShape =
                        currentShapeRef.current?.name === fromName
                            ? currentShapeRef.current.data
                            : await loadShape(fromName);
                    if (cancelled) return;

                    try {
                        sourceSegments = parseClosedPath(sourceShape);
                    } catch (error) {
                        console.error(`Could not prepare shape "${fromName}" for morphing`, error);
                    }
                }

                currentShapeRef.current = { name, data: targetShape };

                const prefersReducedMotion = window.matchMedia(
                    "(prefers-reduced-motion: reduce)"
                ).matches;
                if (
                    !sourceSegments ||
                    !targetSegments ||
                    !Number.isFinite(morphDuration) ||
                    morphDuration <= 0 ||
                    prefersReducedMotion
                ) {
                    setFinalShape(targetShape, targetSegments);
                    return;
                }

                const fromSegments = sourceSegments;
                const alignedTarget = alignSegments(fromSegments, targetSegments);
                const fromPath = cubicSegmentsToPath(fromSegments, 1);
                const targetPath = cubicSegmentsToPath(alignedTarget, 1);
                const pathElement = morphPathRef.current;
                const canUseCssTransition =
                    !outlined &&
                    pathElement !== null &&
                    typeof CSS !== "undefined" &&
                    CSS.supports("d", `path("${fromPath}")`);

                if (canUseCssTransition && pathElement) {
                    const localMaskImage = `url("#${maskId}")`;
                    pathElement.style.transition = "none";
                    pathElement.setAttribute("d", fromPath);
                    pathElement.style.setProperty("d", `path("${fromPath}")`);
                    pathElement.getBoundingClientRect();
                    pathElement.style.transition = `d ${morphDuration}ms ${morphEasing}`;
                    activeTransitionRef.current = {
                        from: fromSegments,
                        to: alignedTarget,
                        startedAt: performance.now(),
                        duration: morphDuration,
                        easing: morphEasing,
                    };
                    if (elementRef.current) setElementMask(elementRef.current, localMaskImage);
                    setMaskImage(localMaskImage);
                    animationFrameRef.current = requestAnimationFrame(() => {
                        pathElement.style.setProperty("d", `path("${targetPath}")`);
                        animationFrameRef.current = null;
                    });
                    transitionTimerRef.current = window.setTimeout(() => {
                        currentSegmentsRef.current = targetSegments;
                        activeTransitionRef.current = null;
                        transitionTimerRef.current = null;
                    }, morphDuration + 50);
                    return;
                }

                const startTime = performance.now();
                const animate = (time: number) => {
                    if (cancelled) return;

                    const progress = Math.min(1, (time - startTime) / morphDuration);
                    const easedProgress = getEasingProgress(progress, morphEasing);
                    const segments = interpolateSegments(
                        fromSegments,
                        alignedTarget,
                        easedProgress
                    );
                    const image = createMaskImage(
                        "0 0 100 100",
                        [cubicSegmentsToPath(segments)],
                        outlined,
                        strokeWidth
                    );

                    currentSegmentsRef.current = segments;
                    if (elementRef.current) setElementMask(elementRef.current, image);

                    if (progress < 1) {
                        animationFrameRef.current = requestAnimationFrame(animate);
                    } else {
                        setMaskImage(image);
                        setMaskReady(true);
                        currentSegmentsRef.current = targetSegments;
                        animationFrameRef.current = null;
                        activeTransitionRef.current = null;
                    }
                };

                animationFrameRef.current = requestAnimationFrame(animate);
            } catch (error) {
                if (cancelled) return;
                console.error(`Could not load shape "${name}"`, error);
                setMaskImage(getShapeMaskUrl(name));
                setMaskReady(true);
            }
        };

        void loadAndRender();

        return () => {
            cancelled = true;
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            if (transitionTimerRef.current !== null) {
                window.clearTimeout(transitionTimerRef.current);
                transitionTimerRef.current = null;
            }
            const activeTransition = activeTransitionRef.current;
            if (activeTransition) {
                const progress = Math.min(
                    1,
                    (performance.now() - activeTransition.startedAt) / activeTransition.duration
                );
                currentSegmentsRef.current = interpolateSegments(
                    activeTransition.from,
                    activeTransition.to,
                    getEasingProgress(progress, activeTransition.easing)
                );
                activeTransitionRef.current = null;
            }
        };
    }, [name, outlined, strokeWidth, morphDuration, morphEasing, maskId]);

    return (<>
		<div
			ref={elementRef}
			style={{
				width: size,
				height: size,
				background,
				backgroundSize: "cover",
				backgroundPosition: "center",
				WebkitMaskImage: maskImage,
				maskImage,
				WebkitMaskRepeat: "no-repeat",
				maskRepeat: "no-repeat",
				WebkitMaskSize: "contain",
				maskSize: "contain",
				WebkitMaskPosition: "center",
				maskPosition: "center",
				visibility: maskReady ? undefined : "hidden",
				...style,
			}}
			{...props}
		/>
		<svg
			aria-hidden="true"
			width="1"
			height="1"
			viewBox="0 0 1 1"
			style={{
				position: "fixed",
				left: "-10000px",
				top: 0,
				pointerEvents: "none",
			}}
		>
			<defs>
				<mask
					id={maskId}
					x="0"
					y="0"
					width="1"
					height="1"
					maskUnits="objectBoundingBox"
					maskContentUnits="objectBoundingBox"
					mask-type="alpha"
				>
					<path
						ref={morphPathRef}
						d="M0 0Z"
						fill={outlined ? "none" : "white"}
						stroke={outlined ? "white" : "none"}
						strokeWidth={outlined ? `${strokeWidth}px` : 0}
						vectorEffect="non-scaling-stroke"
						strokeLinejoin="round"
					/>
				</mask>
			</defs>
		</svg>
	</>);
}
