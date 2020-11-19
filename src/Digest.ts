import { serialize } from './objects';

const SEAL = '--cqes-digest-seal--';

export class Digest {
  protected buffer: Array<number>;
  protected m1:     number;
  protected m2:     number;
  protected offset: number;

  constructor() {
    this.buffer = [ 101, 204, 31, 31, 79, 69, 154, 67, 116, 44, 6, 49, 242, 72, 186, 183 ];
    this.m1     = 42;
    this.m2     = 2843;
    this.offset = 0;
  }

  public update(data: any) {
    let content = typeof data == 'string' ? data : serialize(data, true);
    if (content == null) content = 'null';
    let offset = this.offset;
    let m1 = this.m1, m2 = this.m2;
    main: for (let i = 0; i < content.length; i += 16)
      for (let o = 0; o < 16; o++, offset = (offset + 1) % 16) {
        if (i + o >= content.length) break main;
        const char = content.charCodeAt(i + o);
        m1 = (m1 + (char + offset) * m2) % 1031;
        m2 = (m2 + m1 ^ 0x55555555) % 2179;
        this.buffer[offset] = (m1 + char + this.buffer[offset]) % 256;
      }
    this.offset = offset;
    this.m1 = m1;
    this.m2 = m2;
    return this;
  }

  public toString() {
    this.update(SEAL);
    const output = [];
    for (var o = 0; o < 16; o++) {
      const hex = this.buffer[o].toString(16);
      output[o] = hex.length > 1 ? hex : '0' + hex;
    }
    return output.join('');
  }

}

export function digest(data: any) {
  return new Digest().update(data).toString();
}