import { readFile } from 'node:fs/promises';
import { expect, type Download, type TestInfo } from '@playwright/test';

const XLSX_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function datedXlsxPattern(prefix: string): RegExp {
  return new RegExp(
    `^${escapeRegExp(prefix)}-\\d{4}-\\d{2}-\\d{2}\\.xlsx$`,
    'i',
  );
}

export async function verifySpreadsheetDownload(
  download: Download,
  expectedFilename: RegExp,
  testInfo: TestInfo,
): Promise<string> {
  expect(await download.failure()).toBeNull();

  const filename = download.suggestedFilename();
  expect(filename).toMatch(expectedFilename);

  const outputPath = testInfo.outputPath(filename);
  await download.saveAs(outputPath);

  const file = await readFile(outputPath);
  expect(file.byteLength).toBeGreaterThan(0);
  expect(file.subarray(0, 2).toString('ascii')).toBe('PK');

  await testInfo.attach(filename, {
    path: outputPath,
    contentType: XLSX_CONTENT_TYPE,
  });
  return outputPath;
}
