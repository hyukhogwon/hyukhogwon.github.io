const rules = [
	{ name: 'internal-ticket', pattern: /\b(?:FRONTDEV|QA|RUN|US)-\d+\b/g },
	{ name: 'merge-request', pattern: /\bMR\s*!\d+\b/g },
	{
		name: 'non-public-url',
		pattern: /https?:\/\/(?!github\.com\/hyukhogwon\b|hyukhogwon\.github\.io\b)[^\s)>]+/g,
	},
] as const;

export function findContentPolicyViolations(content: string): string[] {
	return rules.flatMap(({ name, pattern }) =>
		Array.from(content.matchAll(pattern), () => name),
	);
}
