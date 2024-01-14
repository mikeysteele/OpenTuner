import { assertEquals } from 'jsr:@std/assert@1.0.0';
import { parseM3U8 } from './lineup.ts';

Deno.test('parseM3U8 parses valid m3u8 content', () => {
  const input = `#EXTM3U
#EXTINF:-1 tvg-id="ABC" tvg-chno="2" tvg-name="ABC TV",ABC TV
http://example.com/abc.m3u8
#EXTINF:-1 tvg-chno="30" tvg-name="SBS",SBS
http://example.com/sbs.m3u8`;

  const result = parseM3U8(input);

  assertEquals(result.length, 2);

  assertEquals(result[0], {
    GuideNumber: '2',
    GuideName: 'ABC TV',
    GuideId: 'ABC',
    URL: 'http://example.com/abc.m3u8',
  });

  assertEquals(result[1], {
    GuideNumber: '30',
    GuideName: 'SBS',
    GuideId: undefined,
    URL: 'http://example.com/sbs.m3u8',
  });
});

Deno.test('parseM3U8 handles empty content', () => {
  const result = parseM3U8('');
  assertEquals(result.length, 0);
});

Deno.test('parseM3U8 handles duplicate and missing guide numbers', () => {
  const input = `#EXTM3U
#EXTINF:-1 tvg-chno="1" tvg-name="Ch 1",Ch 1
http://example.com/1.m3u8
#EXTINF:-1 tvg-chno="1" tvg-name="Ch 1 Copy",Ch 1 Copy
http://example.com/1-copy.m3u8
#EXTINF:-1 tvg-name="Ch NoNum",Ch NoNum
http://example.com/nonum.m3u8`;

  const result = parseM3U8(input);

  assertEquals(result.length, 3);
  assertEquals(result[0].GuideNumber, '1');
  assertEquals(result[1].GuideNumber, '1'); // Duplicate allowed
  assertEquals(result[2].GuideNumber, undefined); // Undefined allowed
});
