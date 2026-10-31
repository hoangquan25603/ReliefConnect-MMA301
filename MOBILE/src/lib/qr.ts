/**
 * Minimal, zero-dependency QR Code generator for React Native.
 * Based on Kazuhiko Arase's QR Code implementation (MIT).
 */

const QRMode = { MODE_8BIT_BYTE: 4 };
const QRErrorCorrectLevel = { L: 1, M: 0, Q: 3, H: 2 };

class QR8bitByte {
  mode = QRMode.MODE_8BIT_BYTE;
  data: string;
  constructor(data: string) {
    this.data = data;
  }
  getLength(): number {
    return this.data.length;
  }
  write(buffer: QRBitBuffer): void {
    for (let i = 0; i < this.data.length; i++) {
      buffer.put(this.data.charCodeAt(i), 8);
    }
  }
}

class QRBitBuffer {
  buffer: number[] = [];
  length = 0;
  get(index: number): boolean {
    const bufIndex = Math.floor(index / 8);
    return ((this.buffer[bufIndex] >>> (7 - (index % 8))) & 1) === 1;
  }
  put(num: number, length: number): void {
    for (let i = 0; i < length; i++) {
      this.putBit(((num >>> (length - i - 1)) & 1) === 1);
    }
  }
  putBit(bit: boolean): void {
    const bufIndex = Math.floor(this.length / 8);
    if (this.buffer.length <= bufIndex) {
      this.buffer.push(0);
    }
    if (bit) {
      this.buffer[bufIndex] |= 0x80 >>> (this.length % 8);
    }
    this.length++;
  }
  getLengthInBits(): number {
    return this.length;
  }
}

const QRMath = {
  EXP_TABLE: new Array<number>(256),
  LOG_TABLE: new Array<number>(256),
  glog(n: number): number {
    if (n < 1) throw new Error("glog(" + n + ")");
    return QRMath.LOG_TABLE[n];
  },
  gexp(n: number): number {
    let val = n;
    while (val < 0) val += 255;
    while (val >= 256) val -= 255;
    return QRMath.EXP_TABLE[val];
  },
};
for (let i = 0; i < 8; i++) QRMath.EXP_TABLE[i] = 1 << i;
for (let i = 8; i < 256; i++) {
  QRMath.EXP_TABLE[i] =
    QRMath.EXP_TABLE[i - 4] ^
    QRMath.EXP_TABLE[i - 5] ^
    QRMath.EXP_TABLE[i - 6] ^
    QRMath.EXP_TABLE[i - 8];
}
for (let i = 0; i < 255; i++) {
  QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;
}

class QRPolynomial {
  num: number[];
  constructor(num: number[], shift = 0) {
    let offset = 0;
    while (offset < num.length && num[offset] === 0) offset++;
    this.num = new Array(num.length - offset + shift);
    for (let i = 0; i < num.length - offset; i++) {
      this.num[i] = num[i + offset];
    }
    for (let i = num.length - offset; i < this.num.length; i++) {
      this.num[i] = 0;
    }
  }
  get(index: number): number {
    return this.num[index];
  }
  getLength(): number {
    return this.num.length;
  }
  multiply(e: QRPolynomial): QRPolynomial {
    const num = new Array(this.getLength() + e.getLength() - 1).fill(0);
    for (let i = 0; i < this.getLength(); i++) {
      for (let j = 0; j < e.getLength(); j++) {
        num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i)) + QRMath.glog(e.get(j)));
      }
    }
    return new QRPolynomial(num, 0);
  }
  mod(e: QRPolynomial): QRPolynomial {
    if (this.getLength() - e.getLength() < 0) return this;
    const ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
    const num = new Array(this.getLength());
    for (let i = 0; i < this.getLength(); i++) num[i] = this.get(i);
    for (let x = 0; x < e.getLength(); x++) {
      num[x] ^= QRMath.gexp(QRMath.glog(e.get(x)) + ratio);
    }
    return new QRPolynomial(num, 0).mod(e);
  }
}

class QRRSBlock {
  totalCount: number;
  dataCount: number;
  constructor(totalCount: number, dataCount: number) {
    this.totalCount = totalCount;
    this.dataCount = dataCount;
  }
  static RS_BLOCK_TABLE = [
    // 1-10
    [1, 26, 19], [1, 26, 16], [1, 26, 13], [1, 26, 9],
    [1, 44, 34], [1, 44, 28], [1, 44, 22], [1, 44, 16],
    [1, 70, 55], [1, 70, 44], [2, 35, 17], [2, 35, 13],
    [1, 100, 80], [2, 50, 32], [2, 50, 24], [4, 25, 9],
    [1, 134, 108], [2, 67, 43], [2, 33, 15, 2, 34, 16], [2, 33, 11, 2, 34, 12],
    [2, 86, 68], [4, 43, 27], [4, 43, 19], [4, 43, 15],
    [2, 98, 78], [4, 49, 31], [2, 32, 14, 4, 33, 15], [4, 39, 13, 1, 40, 14],
    [2, 121, 97], [2, 60, 38, 2, 61, 39], [4, 40, 18, 2, 41, 19], [4, 40, 14, 2, 41, 15],
    [2, 146, 116], [3, 58, 36, 2, 59, 37], [4, 36, 16, 4, 37, 17], [4, 36, 12, 4, 37, 13],
    [2, 86, 68, 2, 87, 69], [4, 69, 43, 1, 70, 44], [6, 43, 19, 2, 44, 20], [6, 43, 15, 2, 44, 16],
  ];
  static getRSBlocks(typeNumber: number, errorCorrectLevel: number): QRRSBlock[] {
    const offset = (typeNumber - 1) * 4 + errorCorrectLevel;
    const rsBlock = QRRSBlock.RS_BLOCK_TABLE[offset];
    if (!rsBlock) throw new Error("bad rs block @ typeNumber:" + typeNumber + "/errorCorrectLevel:" + errorCorrectLevel);
    const length = rsBlock.length / 3;
    const list: QRRSBlock[] = [];
    for (let i = 0; i < length; i++) {
      const count = rsBlock[i * 3 + 0];
      const totalCount = rsBlock[i * 3 + 1];
      const dataCount = rsBlock[i * 3 + 2];
      for (let j = 0; j < count; j++) {
        list.push(new QRRSBlock(totalCount, dataCount));
      }
    }
    return list;
  }
}

const QRUtil = {
  PATTERN_POSITION_TABLE: [
    [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54],
  ],
  G15: (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0),
  G15_MASK: (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1),
  getBCHTypeInfo(data: number): number {
    let d = data << 10;
    while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) >= 0) {
      d ^= QRUtil.G15 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15));
    }
    return ((data << 10) | d) ^ QRUtil.G15_MASK;
  },
  getBCHDigit(data: number): number {
    let digit = 0;
    let d = data;
    while (d !== 0) {
      digit++;
      d >>>= 1;
    }
    return digit;
  },
  getErrorCorrectPolynomial(errorCorrectLength: number): QRPolynomial {
    let a = new QRPolynomial([1], 0);
    for (let i = 0; i < errorCorrectLength; i++) {
      a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0));
    }
    return a;
  },
  getLengthInBits(type: number): number {
    if (1 <= type && type < 10) return 8;
    return 16;
  },
  getMask(maskPattern: number, i: number, j: number): boolean {
    switch (maskPattern) {
      case 0: return (i + j) % 2 === 0;
      case 1: return i % 2 === 0;
      case 2: return j % 3 === 0;
      case 3: return (i + j) % 3 === 0;
      case 4: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
      case 5: return ((i * j) % 2) + ((i * j) % 3) === 0;
      case 6: return (((i * j) % 2) + ((i * j) % 3)) % 2 === 0;
      case 7: return (((i * j) % 3) + ((i + j) % 2)) % 2 === 0;
      default: throw new Error("bad mask:" + maskPattern);
    }
  },
};

export class QRCodeModel {
  typeNumber = 0;
  errorCorrectLevel: number;
  modules: boolean[][] = [];
  moduleCount = 0;
  dataList: QR8bitByte[] = [];

  constructor(typeNumber: number, errorCorrectLevel: number) {
    this.typeNumber = typeNumber;
    this.errorCorrectLevel = errorCorrectLevel;
  }

  addData(data: string) {
    this.dataList.push(new QR8bitByte(data));
  }

  make() {
    if (this.typeNumber < 1) {
      for (let t = 1; t <= 10; t++) {
        const rsBlocks = QRRSBlock.getRSBlocks(t, this.errorCorrectLevel);
        const buffer = new QRBitBuffer();
        for (let i = 0; i < this.dataList.length; i++) {
          const data = this.dataList[i];
          buffer.put(data.mode, 4);
          buffer.put(data.getLength(), QRUtil.getLengthInBits(t));
          data.write(buffer);
        }
        let totalDataCount = 0;
        for (let i = 0; i < rsBlocks.length; i++) totalDataCount += rsBlocks[i].dataCount;
        if (buffer.getLengthInBits() <= totalDataCount * 8) {
          this.typeNumber = t;
          break;
        }
      }
    }
    if (this.typeNumber < 1) this.typeNumber = 10;
    this.makeImpl(false, 0);
  }

  private makeImpl(test: boolean, maskPattern: number) {
    this.moduleCount = this.typeNumber * 4 + 17;
    this.modules = new Array(this.moduleCount);
    for (let row = 0; row < this.moduleCount; row++) {
      this.modules[row] = new Array(this.moduleCount).fill(null);
    }
    this.setupPositionProbePattern(0, 0);
    this.setupPositionProbePattern(this.moduleCount - 7, 0);
    this.setupPositionProbePattern(0, this.moduleCount - 7);
    this.setupTimingPattern();
    this.setupTypeInfo(test, maskPattern);
    this.mapData(this.createData(), maskPattern);
  }

  private setupPositionProbePattern(row: number, col: number) {
    for (let r = -1; r <= 7; r++) {
      if (row + r <= -1 || this.moduleCount <= row + r) continue;
      for (let c = -1; c <= 7; c++) {
        if (col + c <= -1 || this.moduleCount <= col + c) continue;
        if (
          (0 <= r && r <= 6 && (c === 0 || c === 6)) ||
          (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
          (2 <= r && r <= 4 && 2 <= c && c <= 4)
        ) {
          this.modules[row + r][col + c] = true;
        } else {
          this.modules[row + r][col + c] = false;
        }
      }
    }
  }

  private setupTimingPattern() {
    for (let r = 8; r < this.moduleCount - 8; r++) {
      if (this.modules[r][6] !== null) continue;
      this.modules[r][6] = r % 2 === 0;
    }
    for (let c = 8; c < this.moduleCount - 8; c++) {
      if (this.modules[6][c] !== null) continue;
      this.modules[6][c] = c % 2 === 0;
    }
  }

  private setupTypeInfo(test: boolean, maskPattern: number) {
    const data = (this.errorCorrectLevel << 3) | maskPattern;
    const bits = QRUtil.getBCHTypeInfo(data);
    for (let i = 0; i < 15; i++) {
      const mod = !test && ((bits >> i) & 1) === 1;
      if (i < 6) this.modules[i][8] = mod;
      else if (i < 8) this.modules[i + 1][8] = mod;
      else this.modules[this.moduleCount - 15 + i][8] = mod;
    }
    for (let i = 0; i < 15; i++) {
      const mod = !test && ((bits >> i) & 1) === 1;
      if (i < 8) this.modules[8][this.moduleCount - i - 1] = mod;
      else if (i === 8) this.modules[8][15 - i] = mod;
      else this.modules[8][15 - i - 1] = mod;
    }
    this.modules[this.moduleCount - 8][8] = !test;
  }

  private mapData(data: number[], maskPattern: number) {
    let inc = -1;
    let row = this.moduleCount - 1;
    let bitIndex = 7;
    let byteIndex = 0;
    for (let col = this.moduleCount - 1; col > 0; col -= 2) {
      if (col === 6) col--;
      while (true) {
        for (let c = 0; c < 2; c++) {
          if (this.modules[row][col - c] === null) {
            let dark = false;
            if (byteIndex < data.length) {
              dark = ((data[byteIndex] >>> bitIndex) & 1) === 1;
            }
            const mask = QRUtil.getMask(maskPattern, row, col - c);
            if (mask) dark = !dark;
            this.modules[row][col - c] = dark;
            bitIndex--;
            if (bitIndex === -1) {
              byteIndex++;
              bitIndex = 7;
            }
          }
        }
        row += inc;
        if (row < 0 || this.moduleCount <= row) {
          row -= inc;
          inc = -inc;
          break;
        }
      }
    }
  }

  private createData(): number[] {
    const rsBlocks = QRRSBlock.getRSBlocks(this.typeNumber, this.errorCorrectLevel);
    const buffer = new QRBitBuffer();
    for (let i = 0; i < this.dataList.length; i++) {
      const data = this.dataList[i];
      buffer.put(data.mode, 4);
      buffer.put(data.getLength(), QRUtil.getLengthInBits(this.typeNumber));
      data.write(buffer);
    }
    let totalDataCount = 0;
    for (let i = 0; i < rsBlocks.length; i++) totalDataCount += rsBlocks[i].dataCount;
    if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) buffer.put(0, 4);
    while (buffer.getLengthInBits() % 8 !== 0) buffer.putBit(false);
    while (true) {
      if (buffer.getLengthInBits() >= totalDataCount * 8) break;
      buffer.put(0xec, 8);
      if (buffer.getLengthInBits() >= totalDataCount * 8) break;
      buffer.put(0x11, 8);
    }
    return buffer.buffer;
  }
}

/**
 * Generates a square boolean matrix for the given text.
 * true = dark cell, false = light cell.
 */
export function generateQrMatrix(data: string): boolean[][] {
  const qr = new QRCodeModel(0, QRErrorCorrectLevel.M);
  qr.addData(data);
  qr.make();
  return qr.modules;
}
