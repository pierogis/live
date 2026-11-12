declare module 'virtual:level-list/mosaic' {
	const list: import('$lib/shared/level').Listed<import('$lib/mosaic/engine').Level>[];
	export default list;
}

declare module 'virtual:level-list/forage' {
	const list: import('$lib/shared/level').Listed<import('$lib/forage/engine').Level>[];
	export default list;
}
