export const LABELS = ['Easy', 'Fair', 'Medium', 'Hard', 'Very hard'];

const PEAK = 1.5;

export function muralMeasure(panels: number[]): number {
	return (panels.reduce((a, x) => a + x ** PEAK, 0) / panels.length) ** (1 / PEAK);
}
