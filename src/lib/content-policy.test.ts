import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { findContentPolicyViolations } from './content-policy';

describe('findContentPolicyViolations', () => {
	it('rejects internal identifiers and non-public URLs', () => {
		const content = [
			'FRONTDEV-1234',
			'QA-5678',
			'MR !42',
			'https://gitlab.example.internal/team/project',
		].join('\n');

		expect(findContentPolicyViolations(content)).toEqual([
			'internal-ticket',
			'internal-ticket',
			'merge-request',
			'non-public-url',
		]);
	});

	it('allows public portfolio copy and GitHub links', () => {
		const content =
			'최대 100건 단위로 요청을 나눴습니다. https://github.com/hyukhogwon';

		expect(findContentPolicyViolations(content)).toEqual([]);
	});
});

describe('public project content', () => {
	it('contains seven sanitized case studies with a disclosure', () => {
		const directory = join(process.cwd(), 'src/content/projects');
		const files = readdirSync(directory).filter((file) => file.endsWith('.md'));

		expect(files).toHaveLength(7);

		for (const file of files) {
			const content = readFileSync(join(directory, file), 'utf8');

			expect(content).toContain('운영 소스 원문이 아닙니다.');
			expect(findContentPolicyViolations(content)).toEqual([]);
		}
	});
});
