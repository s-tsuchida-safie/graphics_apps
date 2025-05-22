(() => {
  // node_modules/csv-parse/dist/esm/sync.js
  var global$1 = typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};
  var lookup = [];
  var revLookup = [];
  var Arr = typeof Uint8Array !== "undefined" ? Uint8Array : Array;
  var inited = false;
  function init() {
    inited = true;
    var code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    for (var i = 0, len = code.length; i < len; ++i) {
      lookup[i] = code[i];
      revLookup[code.charCodeAt(i)] = i;
    }
    revLookup["-".charCodeAt(0)] = 62;
    revLookup["_".charCodeAt(0)] = 63;
  }
  function toByteArray(b64) {
    if (!inited) {
      init();
    }
    var i, j, l, tmp, placeHolders, arr;
    var len = b64.length;
    if (len % 4 > 0) {
      throw new Error("Invalid string. Length must be a multiple of 4");
    }
    placeHolders = b64[len - 2] === "=" ? 2 : b64[len - 1] === "=" ? 1 : 0;
    arr = new Arr(len * 3 / 4 - placeHolders);
    l = placeHolders > 0 ? len - 4 : len;
    var L = 0;
    for (i = 0, j = 0; i < l; i += 4, j += 3) {
      tmp = revLookup[b64.charCodeAt(i)] << 18 | revLookup[b64.charCodeAt(i + 1)] << 12 | revLookup[b64.charCodeAt(i + 2)] << 6 | revLookup[b64.charCodeAt(i + 3)];
      arr[L++] = tmp >> 16 & 255;
      arr[L++] = tmp >> 8 & 255;
      arr[L++] = tmp & 255;
    }
    if (placeHolders === 2) {
      tmp = revLookup[b64.charCodeAt(i)] << 2 | revLookup[b64.charCodeAt(i + 1)] >> 4;
      arr[L++] = tmp & 255;
    } else if (placeHolders === 1) {
      tmp = revLookup[b64.charCodeAt(i)] << 10 | revLookup[b64.charCodeAt(i + 1)] << 4 | revLookup[b64.charCodeAt(i + 2)] >> 2;
      arr[L++] = tmp >> 8 & 255;
      arr[L++] = tmp & 255;
    }
    return arr;
  }
  function tripletToBase64(num) {
    return lookup[num >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[num & 63];
  }
  function encodeChunk(uint8, start, end) {
    var tmp;
    var output = [];
    for (var i = start; i < end; i += 3) {
      tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + uint8[i + 2];
      output.push(tripletToBase64(tmp));
    }
    return output.join("");
  }
  function fromByteArray(uint8) {
    if (!inited) {
      init();
    }
    var tmp;
    var len = uint8.length;
    var extraBytes = len % 3;
    var output = "";
    var parts = [];
    var maxChunkLength = 16383;
    for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
      parts.push(encodeChunk(uint8, i, i + maxChunkLength > len2 ? len2 : i + maxChunkLength));
    }
    if (extraBytes === 1) {
      tmp = uint8[len - 1];
      output += lookup[tmp >> 2];
      output += lookup[tmp << 4 & 63];
      output += "==";
    } else if (extraBytes === 2) {
      tmp = (uint8[len - 2] << 8) + uint8[len - 1];
      output += lookup[tmp >> 10];
      output += lookup[tmp >> 4 & 63];
      output += lookup[tmp << 2 & 63];
      output += "=";
    }
    parts.push(output);
    return parts.join("");
  }
  function read(buffer, offset, isLE, mLen, nBytes) {
    var e, m;
    var eLen = nBytes * 8 - mLen - 1;
    var eMax = (1 << eLen) - 1;
    var eBias = eMax >> 1;
    var nBits = -7;
    var i = isLE ? nBytes - 1 : 0;
    var d = isLE ? -1 : 1;
    var s = buffer[offset + i];
    i += d;
    e = s & (1 << -nBits) - 1;
    s >>= -nBits;
    nBits += eLen;
    for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {
    }
    m = e & (1 << -nBits) - 1;
    e >>= -nBits;
    nBits += mLen;
    for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {
    }
    if (e === 0) {
      e = 1 - eBias;
    } else if (e === eMax) {
      return m ? NaN : (s ? -1 : 1) * Infinity;
    } else {
      m = m + Math.pow(2, mLen);
      e = e - eBias;
    }
    return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
  }
  function write(buffer, value, offset, isLE, mLen, nBytes) {
    var e, m, c;
    var eLen = nBytes * 8 - mLen - 1;
    var eMax = (1 << eLen) - 1;
    var eBias = eMax >> 1;
    var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
    var i = isLE ? 0 : nBytes - 1;
    var d = isLE ? 1 : -1;
    var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
    value = Math.abs(value);
    if (isNaN(value) || value === Infinity) {
      m = isNaN(value) ? 1 : 0;
      e = eMax;
    } else {
      e = Math.floor(Math.log(value) / Math.LN2);
      if (value * (c = Math.pow(2, -e)) < 1) {
        e--;
        c *= 2;
      }
      if (e + eBias >= 1) {
        value += rt / c;
      } else {
        value += rt * Math.pow(2, 1 - eBias);
      }
      if (value * c >= 2) {
        e++;
        c /= 2;
      }
      if (e + eBias >= eMax) {
        m = 0;
        e = eMax;
      } else if (e + eBias >= 1) {
        m = (value * c - 1) * Math.pow(2, mLen);
        e = e + eBias;
      } else {
        m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
        e = 0;
      }
    }
    for (; mLen >= 8; buffer[offset + i] = m & 255, i += d, m /= 256, mLen -= 8) {
    }
    e = e << mLen | m;
    eLen += mLen;
    for (; eLen > 0; buffer[offset + i] = e & 255, i += d, e /= 256, eLen -= 8) {
    }
    buffer[offset + i - d] |= s * 128;
  }
  var toString = {}.toString;
  var isArray = Array.isArray || function(arr) {
    return toString.call(arr) == "[object Array]";
  };
  var INSPECT_MAX_BYTES = 50;
  Buffer.TYPED_ARRAY_SUPPORT = global$1.TYPED_ARRAY_SUPPORT !== void 0 ? global$1.TYPED_ARRAY_SUPPORT : true;
  kMaxLength();
  function kMaxLength() {
    return Buffer.TYPED_ARRAY_SUPPORT ? 2147483647 : 1073741823;
  }
  function createBuffer(that, length) {
    if (kMaxLength() < length) {
      throw new RangeError("Invalid typed array length");
    }
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      that = new Uint8Array(length);
      that.__proto__ = Buffer.prototype;
    } else {
      if (that === null) {
        that = new Buffer(length);
      }
      that.length = length;
    }
    return that;
  }
  function Buffer(arg, encodingOrOffset, length) {
    if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
      return new Buffer(arg, encodingOrOffset, length);
    }
    if (typeof arg === "number") {
      if (typeof encodingOrOffset === "string") {
        throw new Error(
          "If encoding is specified then the first argument must be a string"
        );
      }
      return allocUnsafe(this, arg);
    }
    return from(this, arg, encodingOrOffset, length);
  }
  Buffer.poolSize = 8192;
  Buffer._augment = function(arr) {
    arr.__proto__ = Buffer.prototype;
    return arr;
  };
  function from(that, value, encodingOrOffset, length) {
    if (typeof value === "number") {
      throw new TypeError('"value" argument must not be a number');
    }
    if (typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer) {
      return fromArrayBuffer(that, value, encodingOrOffset, length);
    }
    if (typeof value === "string") {
      return fromString(that, value, encodingOrOffset);
    }
    return fromObject(that, value);
  }
  Buffer.from = function(value, encodingOrOffset, length) {
    return from(null, value, encodingOrOffset, length);
  };
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    Buffer.prototype.__proto__ = Uint8Array.prototype;
    Buffer.__proto__ = Uint8Array;
    if (typeof Symbol !== "undefined" && Symbol.species && Buffer[Symbol.species] === Buffer) ;
  }
  function assertSize(size) {
    if (typeof size !== "number") {
      throw new TypeError('"size" argument must be a number');
    } else if (size < 0) {
      throw new RangeError('"size" argument must not be negative');
    }
  }
  function alloc(that, size, fill2, encoding) {
    assertSize(size);
    if (size <= 0) {
      return createBuffer(that, size);
    }
    if (fill2 !== void 0) {
      return typeof encoding === "string" ? createBuffer(that, size).fill(fill2, encoding) : createBuffer(that, size).fill(fill2);
    }
    return createBuffer(that, size);
  }
  Buffer.alloc = function(size, fill2, encoding) {
    return alloc(null, size, fill2, encoding);
  };
  function allocUnsafe(that, size) {
    assertSize(size);
    that = createBuffer(that, size < 0 ? 0 : checked(size) | 0);
    if (!Buffer.TYPED_ARRAY_SUPPORT) {
      for (var i = 0; i < size; ++i) {
        that[i] = 0;
      }
    }
    return that;
  }
  Buffer.allocUnsafe = function(size) {
    return allocUnsafe(null, size);
  };
  Buffer.allocUnsafeSlow = function(size) {
    return allocUnsafe(null, size);
  };
  function fromString(that, string, encoding) {
    if (typeof encoding !== "string" || encoding === "") {
      encoding = "utf8";
    }
    if (!Buffer.isEncoding(encoding)) {
      throw new TypeError('"encoding" must be a valid string encoding');
    }
    var length = byteLength(string, encoding) | 0;
    that = createBuffer(that, length);
    var actual = that.write(string, encoding);
    if (actual !== length) {
      that = that.slice(0, actual);
    }
    return that;
  }
  function fromArrayLike(that, array) {
    var length = array.length < 0 ? 0 : checked(array.length) | 0;
    that = createBuffer(that, length);
    for (var i = 0; i < length; i += 1) {
      that[i] = array[i] & 255;
    }
    return that;
  }
  function fromArrayBuffer(that, array, byteOffset, length) {
    array.byteLength;
    if (byteOffset < 0 || array.byteLength < byteOffset) {
      throw new RangeError("'offset' is out of bounds");
    }
    if (array.byteLength < byteOffset + (length || 0)) {
      throw new RangeError("'length' is out of bounds");
    }
    if (byteOffset === void 0 && length === void 0) {
      array = new Uint8Array(array);
    } else if (length === void 0) {
      array = new Uint8Array(array, byteOffset);
    } else {
      array = new Uint8Array(array, byteOffset, length);
    }
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      that = array;
      that.__proto__ = Buffer.prototype;
    } else {
      that = fromArrayLike(that, array);
    }
    return that;
  }
  function fromObject(that, obj) {
    if (internalIsBuffer(obj)) {
      var len = checked(obj.length) | 0;
      that = createBuffer(that, len);
      if (that.length === 0) {
        return that;
      }
      obj.copy(that, 0, 0, len);
      return that;
    }
    if (obj) {
      if (typeof ArrayBuffer !== "undefined" && obj.buffer instanceof ArrayBuffer || "length" in obj) {
        if (typeof obj.length !== "number" || isnan(obj.length)) {
          return createBuffer(that, 0);
        }
        return fromArrayLike(that, obj);
      }
      if (obj.type === "Buffer" && isArray(obj.data)) {
        return fromArrayLike(that, obj.data);
      }
    }
    throw new TypeError("First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.");
  }
  function checked(length) {
    if (length >= kMaxLength()) {
      throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + kMaxLength().toString(16) + " bytes");
    }
    return length | 0;
  }
  Buffer.isBuffer = isBuffer;
  function internalIsBuffer(b) {
    return !!(b != null && b._isBuffer);
  }
  Buffer.compare = function compare(a, b) {
    if (!internalIsBuffer(a) || !internalIsBuffer(b)) {
      throw new TypeError("Arguments must be Buffers");
    }
    if (a === b) return 0;
    var x = a.length;
    var y = b.length;
    for (var i = 0, len = Math.min(x, y); i < len; ++i) {
      if (a[i] !== b[i]) {
        x = a[i];
        y = b[i];
        break;
      }
    }
    if (x < y) return -1;
    if (y < x) return 1;
    return 0;
  };
  Buffer.isEncoding = function isEncoding(encoding) {
    switch (String(encoding).toLowerCase()) {
      case "hex":
      case "utf8":
      case "utf-8":
      case "ascii":
      case "latin1":
      case "binary":
      case "base64":
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
        return true;
      default:
        return false;
    }
  };
  Buffer.concat = function concat(list, length) {
    if (!isArray(list)) {
      throw new TypeError('"list" argument must be an Array of Buffers');
    }
    if (list.length === 0) {
      return Buffer.alloc(0);
    }
    var i;
    if (length === void 0) {
      length = 0;
      for (i = 0; i < list.length; ++i) {
        length += list[i].length;
      }
    }
    var buffer = Buffer.allocUnsafe(length);
    var pos = 0;
    for (i = 0; i < list.length; ++i) {
      var buf = list[i];
      if (!internalIsBuffer(buf)) {
        throw new TypeError('"list" argument must be an Array of Buffers');
      }
      buf.copy(buffer, pos);
      pos += buf.length;
    }
    return buffer;
  };
  function byteLength(string, encoding) {
    if (internalIsBuffer(string)) {
      return string.length;
    }
    if (typeof ArrayBuffer !== "undefined" && typeof ArrayBuffer.isView === "function" && (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
      return string.byteLength;
    }
    if (typeof string !== "string") {
      string = "" + string;
    }
    var len = string.length;
    if (len === 0) return 0;
    var loweredCase = false;
    for (; ; ) {
      switch (encoding) {
        case "ascii":
        case "latin1":
        case "binary":
          return len;
        case "utf8":
        case "utf-8":
        case void 0:
          return utf8ToBytes(string).length;
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
          return len * 2;
        case "hex":
          return len >>> 1;
        case "base64":
          return base64ToBytes(string).length;
        default:
          if (loweredCase) return utf8ToBytes(string).length;
          encoding = ("" + encoding).toLowerCase();
          loweredCase = true;
      }
    }
  }
  Buffer.byteLength = byteLength;
  function slowToString(encoding, start, end) {
    var loweredCase = false;
    if (start === void 0 || start < 0) {
      start = 0;
    }
    if (start > this.length) {
      return "";
    }
    if (end === void 0 || end > this.length) {
      end = this.length;
    }
    if (end <= 0) {
      return "";
    }
    end >>>= 0;
    start >>>= 0;
    if (end <= start) {
      return "";
    }
    if (!encoding) encoding = "utf8";
    while (true) {
      switch (encoding) {
        case "hex":
          return hexSlice(this, start, end);
        case "utf8":
        case "utf-8":
          return utf8Slice(this, start, end);
        case "ascii":
          return asciiSlice(this, start, end);
        case "latin1":
        case "binary":
          return latin1Slice(this, start, end);
        case "base64":
          return base64Slice(this, start, end);
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
          return utf16leSlice(this, start, end);
        default:
          if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
          encoding = (encoding + "").toLowerCase();
          loweredCase = true;
      }
    }
  }
  Buffer.prototype._isBuffer = true;
  function swap(b, n, m) {
    var i = b[n];
    b[n] = b[m];
    b[m] = i;
  }
  Buffer.prototype.swap16 = function swap16() {
    var len = this.length;
    if (len % 2 !== 0) {
      throw new RangeError("Buffer size must be a multiple of 16-bits");
    }
    for (var i = 0; i < len; i += 2) {
      swap(this, i, i + 1);
    }
    return this;
  };
  Buffer.prototype.swap32 = function swap32() {
    var len = this.length;
    if (len % 4 !== 0) {
      throw new RangeError("Buffer size must be a multiple of 32-bits");
    }
    for (var i = 0; i < len; i += 4) {
      swap(this, i, i + 3);
      swap(this, i + 1, i + 2);
    }
    return this;
  };
  Buffer.prototype.swap64 = function swap64() {
    var len = this.length;
    if (len % 8 !== 0) {
      throw new RangeError("Buffer size must be a multiple of 64-bits");
    }
    for (var i = 0; i < len; i += 8) {
      swap(this, i, i + 7);
      swap(this, i + 1, i + 6);
      swap(this, i + 2, i + 5);
      swap(this, i + 3, i + 4);
    }
    return this;
  };
  Buffer.prototype.toString = function toString2() {
    var length = this.length | 0;
    if (length === 0) return "";
    if (arguments.length === 0) return utf8Slice(this, 0, length);
    return slowToString.apply(this, arguments);
  };
  Buffer.prototype.equals = function equals(b) {
    if (!internalIsBuffer(b)) throw new TypeError("Argument must be a Buffer");
    if (this === b) return true;
    return Buffer.compare(this, b) === 0;
  };
  Buffer.prototype.inspect = function inspect() {
    var str = "";
    var max = INSPECT_MAX_BYTES;
    if (this.length > 0) {
      str = this.toString("hex", 0, max).match(/.{2}/g).join(" ");
      if (this.length > max) str += " ... ";
    }
    return "<Buffer " + str + ">";
  };
  Buffer.prototype.compare = function compare2(target2, start, end, thisStart, thisEnd) {
    if (!internalIsBuffer(target2)) {
      throw new TypeError("Argument must be a Buffer");
    }
    if (start === void 0) {
      start = 0;
    }
    if (end === void 0) {
      end = target2 ? target2.length : 0;
    }
    if (thisStart === void 0) {
      thisStart = 0;
    }
    if (thisEnd === void 0) {
      thisEnd = this.length;
    }
    if (start < 0 || end > target2.length || thisStart < 0 || thisEnd > this.length) {
      throw new RangeError("out of range index");
    }
    if (thisStart >= thisEnd && start >= end) {
      return 0;
    }
    if (thisStart >= thisEnd) {
      return -1;
    }
    if (start >= end) {
      return 1;
    }
    start >>>= 0;
    end >>>= 0;
    thisStart >>>= 0;
    thisEnd >>>= 0;
    if (this === target2) return 0;
    var x = thisEnd - thisStart;
    var y = end - start;
    var len = Math.min(x, y);
    var thisCopy = this.slice(thisStart, thisEnd);
    var targetCopy = target2.slice(start, end);
    for (var i = 0; i < len; ++i) {
      if (thisCopy[i] !== targetCopy[i]) {
        x = thisCopy[i];
        y = targetCopy[i];
        break;
      }
    }
    if (x < y) return -1;
    if (y < x) return 1;
    return 0;
  };
  function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
    if (buffer.length === 0) return -1;
    if (typeof byteOffset === "string") {
      encoding = byteOffset;
      byteOffset = 0;
    } else if (byteOffset > 2147483647) {
      byteOffset = 2147483647;
    } else if (byteOffset < -2147483648) {
      byteOffset = -2147483648;
    }
    byteOffset = +byteOffset;
    if (isNaN(byteOffset)) {
      byteOffset = dir ? 0 : buffer.length - 1;
    }
    if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
    if (byteOffset >= buffer.length) {
      if (dir) return -1;
      else byteOffset = buffer.length - 1;
    } else if (byteOffset < 0) {
      if (dir) byteOffset = 0;
      else return -1;
    }
    if (typeof val === "string") {
      val = Buffer.from(val, encoding);
    }
    if (internalIsBuffer(val)) {
      if (val.length === 0) {
        return -1;
      }
      return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
    } else if (typeof val === "number") {
      val = val & 255;
      if (Buffer.TYPED_ARRAY_SUPPORT && typeof Uint8Array.prototype.indexOf === "function") {
        if (dir) {
          return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
        } else {
          return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
        }
      }
      return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
    }
    throw new TypeError("val must be string, number or Buffer");
  }
  function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
    var indexSize = 1;
    var arrLength = arr.length;
    var valLength = val.length;
    if (encoding !== void 0) {
      encoding = String(encoding).toLowerCase();
      if (encoding === "ucs2" || encoding === "ucs-2" || encoding === "utf16le" || encoding === "utf-16le") {
        if (arr.length < 2 || val.length < 2) {
          return -1;
        }
        indexSize = 2;
        arrLength /= 2;
        valLength /= 2;
        byteOffset /= 2;
      }
    }
    function read2(buf, i2) {
      if (indexSize === 1) {
        return buf[i2];
      } else {
        return buf.readUInt16BE(i2 * indexSize);
      }
    }
    var i;
    if (dir) {
      var foundIndex = -1;
      for (i = byteOffset; i < arrLength; i++) {
        if (read2(arr, i) === read2(val, foundIndex === -1 ? 0 : i - foundIndex)) {
          if (foundIndex === -1) foundIndex = i;
          if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
        } else {
          if (foundIndex !== -1) i -= i - foundIndex;
          foundIndex = -1;
        }
      }
    } else {
      if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
      for (i = byteOffset; i >= 0; i--) {
        var found = true;
        for (var j = 0; j < valLength; j++) {
          if (read2(arr, i + j) !== read2(val, j)) {
            found = false;
            break;
          }
        }
        if (found) return i;
      }
    }
    return -1;
  }
  Buffer.prototype.includes = function includes(val, byteOffset, encoding) {
    return this.indexOf(val, byteOffset, encoding) !== -1;
  };
  Buffer.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
    return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
  };
  Buffer.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
    return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
  };
  function hexWrite(buf, string, offset, length) {
    offset = Number(offset) || 0;
    var remaining = buf.length - offset;
    if (!length) {
      length = remaining;
    } else {
      length = Number(length);
      if (length > remaining) {
        length = remaining;
      }
    }
    var strLen = string.length;
    if (strLen % 2 !== 0) throw new TypeError("Invalid hex string");
    if (length > strLen / 2) {
      length = strLen / 2;
    }
    for (var i = 0; i < length; ++i) {
      var parsed = parseInt(string.substr(i * 2, 2), 16);
      if (isNaN(parsed)) return i;
      buf[offset + i] = parsed;
    }
    return i;
  }
  function utf8Write(buf, string, offset, length) {
    return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
  }
  function asciiWrite(buf, string, offset, length) {
    return blitBuffer(asciiToBytes(string), buf, offset, length);
  }
  function latin1Write(buf, string, offset, length) {
    return asciiWrite(buf, string, offset, length);
  }
  function base64Write(buf, string, offset, length) {
    return blitBuffer(base64ToBytes(string), buf, offset, length);
  }
  function ucs2Write(buf, string, offset, length) {
    return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
  }
  Buffer.prototype.write = function write2(string, offset, length, encoding) {
    if (offset === void 0) {
      encoding = "utf8";
      length = this.length;
      offset = 0;
    } else if (length === void 0 && typeof offset === "string") {
      encoding = offset;
      length = this.length;
      offset = 0;
    } else if (isFinite(offset)) {
      offset = offset | 0;
      if (isFinite(length)) {
        length = length | 0;
        if (encoding === void 0) encoding = "utf8";
      } else {
        encoding = length;
        length = void 0;
      }
    } else {
      throw new Error(
        "Buffer.write(string, encoding, offset[, length]) is no longer supported"
      );
    }
    var remaining = this.length - offset;
    if (length === void 0 || length > remaining) length = remaining;
    if (string.length > 0 && (length < 0 || offset < 0) || offset > this.length) {
      throw new RangeError("Attempt to write outside buffer bounds");
    }
    if (!encoding) encoding = "utf8";
    var loweredCase = false;
    for (; ; ) {
      switch (encoding) {
        case "hex":
          return hexWrite(this, string, offset, length);
        case "utf8":
        case "utf-8":
          return utf8Write(this, string, offset, length);
        case "ascii":
          return asciiWrite(this, string, offset, length);
        case "latin1":
        case "binary":
          return latin1Write(this, string, offset, length);
        case "base64":
          return base64Write(this, string, offset, length);
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
          return ucs2Write(this, string, offset, length);
        default:
          if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
          encoding = ("" + encoding).toLowerCase();
          loweredCase = true;
      }
    }
  };
  Buffer.prototype.toJSON = function toJSON() {
    return {
      type: "Buffer",
      data: Array.prototype.slice.call(this._arr || this, 0)
    };
  };
  function base64Slice(buf, start, end) {
    if (start === 0 && end === buf.length) {
      return fromByteArray(buf);
    } else {
      return fromByteArray(buf.slice(start, end));
    }
  }
  function utf8Slice(buf, start, end) {
    end = Math.min(buf.length, end);
    var res = [];
    var i = start;
    while (i < end) {
      var firstByte = buf[i];
      var codePoint = null;
      var bytesPerSequence = firstByte > 239 ? 4 : firstByte > 223 ? 3 : firstByte > 191 ? 2 : 1;
      if (i + bytesPerSequence <= end) {
        var secondByte, thirdByte, fourthByte, tempCodePoint;
        switch (bytesPerSequence) {
          case 1:
            if (firstByte < 128) {
              codePoint = firstByte;
            }
            break;
          case 2:
            secondByte = buf[i + 1];
            if ((secondByte & 192) === 128) {
              tempCodePoint = (firstByte & 31) << 6 | secondByte & 63;
              if (tempCodePoint > 127) {
                codePoint = tempCodePoint;
              }
            }
            break;
          case 3:
            secondByte = buf[i + 1];
            thirdByte = buf[i + 2];
            if ((secondByte & 192) === 128 && (thirdByte & 192) === 128) {
              tempCodePoint = (firstByte & 15) << 12 | (secondByte & 63) << 6 | thirdByte & 63;
              if (tempCodePoint > 2047 && (tempCodePoint < 55296 || tempCodePoint > 57343)) {
                codePoint = tempCodePoint;
              }
            }
            break;
          case 4:
            secondByte = buf[i + 1];
            thirdByte = buf[i + 2];
            fourthByte = buf[i + 3];
            if ((secondByte & 192) === 128 && (thirdByte & 192) === 128 && (fourthByte & 192) === 128) {
              tempCodePoint = (firstByte & 15) << 18 | (secondByte & 63) << 12 | (thirdByte & 63) << 6 | fourthByte & 63;
              if (tempCodePoint > 65535 && tempCodePoint < 1114112) {
                codePoint = tempCodePoint;
              }
            }
        }
      }
      if (codePoint === null) {
        codePoint = 65533;
        bytesPerSequence = 1;
      } else if (codePoint > 65535) {
        codePoint -= 65536;
        res.push(codePoint >>> 10 & 1023 | 55296);
        codePoint = 56320 | codePoint & 1023;
      }
      res.push(codePoint);
      i += bytesPerSequence;
    }
    return decodeCodePointsArray(res);
  }
  var MAX_ARGUMENTS_LENGTH = 4096;
  function decodeCodePointsArray(codePoints) {
    var len = codePoints.length;
    if (len <= MAX_ARGUMENTS_LENGTH) {
      return String.fromCharCode.apply(String, codePoints);
    }
    var res = "";
    var i = 0;
    while (i < len) {
      res += String.fromCharCode.apply(
        String,
        codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
      );
    }
    return res;
  }
  function asciiSlice(buf, start, end) {
    var ret = "";
    end = Math.min(buf.length, end);
    for (var i = start; i < end; ++i) {
      ret += String.fromCharCode(buf[i] & 127);
    }
    return ret;
  }
  function latin1Slice(buf, start, end) {
    var ret = "";
    end = Math.min(buf.length, end);
    for (var i = start; i < end; ++i) {
      ret += String.fromCharCode(buf[i]);
    }
    return ret;
  }
  function hexSlice(buf, start, end) {
    var len = buf.length;
    if (!start || start < 0) start = 0;
    if (!end || end < 0 || end > len) end = len;
    var out = "";
    for (var i = start; i < end; ++i) {
      out += toHex(buf[i]);
    }
    return out;
  }
  function utf16leSlice(buf, start, end) {
    var bytes = buf.slice(start, end);
    var res = "";
    for (var i = 0; i < bytes.length; i += 2) {
      res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
    }
    return res;
  }
  Buffer.prototype.slice = function slice(start, end) {
    var len = this.length;
    start = ~~start;
    end = end === void 0 ? len : ~~end;
    if (start < 0) {
      start += len;
      if (start < 0) start = 0;
    } else if (start > len) {
      start = len;
    }
    if (end < 0) {
      end += len;
      if (end < 0) end = 0;
    } else if (end > len) {
      end = len;
    }
    if (end < start) end = start;
    var newBuf;
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      newBuf = this.subarray(start, end);
      newBuf.__proto__ = Buffer.prototype;
    } else {
      var sliceLen = end - start;
      newBuf = new Buffer(sliceLen, void 0);
      for (var i = 0; i < sliceLen; ++i) {
        newBuf[i] = this[i + start];
      }
    }
    return newBuf;
  };
  function checkOffset(offset, ext, length) {
    if (offset % 1 !== 0 || offset < 0) throw new RangeError("offset is not uint");
    if (offset + ext > length) throw new RangeError("Trying to access beyond buffer length");
  }
  Buffer.prototype.readUIntLE = function readUIntLE(offset, byteLength2, noAssert) {
    offset = offset | 0;
    byteLength2 = byteLength2 | 0;
    if (!noAssert) checkOffset(offset, byteLength2, this.length);
    var val = this[offset];
    var mul = 1;
    var i = 0;
    while (++i < byteLength2 && (mul *= 256)) {
      val += this[offset + i] * mul;
    }
    return val;
  };
  Buffer.prototype.readUIntBE = function readUIntBE(offset, byteLength2, noAssert) {
    offset = offset | 0;
    byteLength2 = byteLength2 | 0;
    if (!noAssert) {
      checkOffset(offset, byteLength2, this.length);
    }
    var val = this[offset + --byteLength2];
    var mul = 1;
    while (byteLength2 > 0 && (mul *= 256)) {
      val += this[offset + --byteLength2] * mul;
    }
    return val;
  };
  Buffer.prototype.readUInt8 = function readUInt8(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 1, this.length);
    return this[offset];
  };
  Buffer.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 2, this.length);
    return this[offset] | this[offset + 1] << 8;
  };
  Buffer.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 2, this.length);
    return this[offset] << 8 | this[offset + 1];
  };
  Buffer.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);
    return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 16777216;
  };
  Buffer.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);
    return this[offset] * 16777216 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
  };
  Buffer.prototype.readIntLE = function readIntLE(offset, byteLength2, noAssert) {
    offset = offset | 0;
    byteLength2 = byteLength2 | 0;
    if (!noAssert) checkOffset(offset, byteLength2, this.length);
    var val = this[offset];
    var mul = 1;
    var i = 0;
    while (++i < byteLength2 && (mul *= 256)) {
      val += this[offset + i] * mul;
    }
    mul *= 128;
    if (val >= mul) val -= Math.pow(2, 8 * byteLength2);
    return val;
  };
  Buffer.prototype.readIntBE = function readIntBE(offset, byteLength2, noAssert) {
    offset = offset | 0;
    byteLength2 = byteLength2 | 0;
    if (!noAssert) checkOffset(offset, byteLength2, this.length);
    var i = byteLength2;
    var mul = 1;
    var val = this[offset + --i];
    while (i > 0 && (mul *= 256)) {
      val += this[offset + --i] * mul;
    }
    mul *= 128;
    if (val >= mul) val -= Math.pow(2, 8 * byteLength2);
    return val;
  };
  Buffer.prototype.readInt8 = function readInt8(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 1, this.length);
    if (!(this[offset] & 128)) return this[offset];
    return (255 - this[offset] + 1) * -1;
  };
  Buffer.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 2, this.length);
    var val = this[offset] | this[offset + 1] << 8;
    return val & 32768 ? val | 4294901760 : val;
  };
  Buffer.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 2, this.length);
    var val = this[offset + 1] | this[offset] << 8;
    return val & 32768 ? val | 4294901760 : val;
  };
  Buffer.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);
    return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
  };
  Buffer.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);
    return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
  };
  Buffer.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);
    return read(this, offset, true, 23, 4);
  };
  Buffer.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);
    return read(this, offset, false, 23, 4);
  };
  Buffer.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 8, this.length);
    return read(this, offset, true, 52, 8);
  };
  Buffer.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 8, this.length);
    return read(this, offset, false, 52, 8);
  };
  function checkInt(buf, value, offset, ext, max, min) {
    if (!internalIsBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance');
    if (value > max || value < min) throw new RangeError('"value" argument is out of bounds');
    if (offset + ext > buf.length) throw new RangeError("Index out of range");
  }
  Buffer.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength2, noAssert) {
    value = +value;
    offset = offset | 0;
    byteLength2 = byteLength2 | 0;
    if (!noAssert) {
      var maxBytes = Math.pow(2, 8 * byteLength2) - 1;
      checkInt(this, value, offset, byteLength2, maxBytes, 0);
    }
    var mul = 1;
    var i = 0;
    this[offset] = value & 255;
    while (++i < byteLength2 && (mul *= 256)) {
      this[offset + i] = value / mul & 255;
    }
    return offset + byteLength2;
  };
  Buffer.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength2, noAssert) {
    value = +value;
    offset = offset | 0;
    byteLength2 = byteLength2 | 0;
    if (!noAssert) {
      var maxBytes = Math.pow(2, 8 * byteLength2) - 1;
      checkInt(this, value, offset, byteLength2, maxBytes, 0);
    }
    var i = byteLength2 - 1;
    var mul = 1;
    this[offset + i] = value & 255;
    while (--i >= 0 && (mul *= 256)) {
      this[offset + i] = value / mul & 255;
    }
    return offset + byteLength2;
  };
  Buffer.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 1, 255, 0);
    if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
    this[offset] = value & 255;
    return offset + 1;
  };
  function objectWriteUInt16(buf, value, offset, littleEndian) {
    if (value < 0) value = 65535 + value + 1;
    for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
      buf[offset + i] = (value & 255 << 8 * (littleEndian ? i : 1 - i)) >>> (littleEndian ? i : 1 - i) * 8;
    }
  }
  Buffer.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = value & 255;
      this[offset + 1] = value >>> 8;
    } else {
      objectWriteUInt16(this, value, offset, true);
    }
    return offset + 2;
  };
  Buffer.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = value >>> 8;
      this[offset + 1] = value & 255;
    } else {
      objectWriteUInt16(this, value, offset, false);
    }
    return offset + 2;
  };
  function objectWriteUInt32(buf, value, offset, littleEndian) {
    if (value < 0) value = 4294967295 + value + 1;
    for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
      buf[offset + i] = value >>> (littleEndian ? i : 3 - i) * 8 & 255;
    }
  }
  Buffer.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset + 3] = value >>> 24;
      this[offset + 2] = value >>> 16;
      this[offset + 1] = value >>> 8;
      this[offset] = value & 255;
    } else {
      objectWriteUInt32(this, value, offset, true);
    }
    return offset + 4;
  };
  Buffer.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = value >>> 24;
      this[offset + 1] = value >>> 16;
      this[offset + 2] = value >>> 8;
      this[offset + 3] = value & 255;
    } else {
      objectWriteUInt32(this, value, offset, false);
    }
    return offset + 4;
  };
  Buffer.prototype.writeIntLE = function writeIntLE(value, offset, byteLength2, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) {
      var limit = Math.pow(2, 8 * byteLength2 - 1);
      checkInt(this, value, offset, byteLength2, limit - 1, -limit);
    }
    var i = 0;
    var mul = 1;
    var sub = 0;
    this[offset] = value & 255;
    while (++i < byteLength2 && (mul *= 256)) {
      if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
        sub = 1;
      }
      this[offset + i] = (value / mul >> 0) - sub & 255;
    }
    return offset + byteLength2;
  };
  Buffer.prototype.writeIntBE = function writeIntBE(value, offset, byteLength2, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) {
      var limit = Math.pow(2, 8 * byteLength2 - 1);
      checkInt(this, value, offset, byteLength2, limit - 1, -limit);
    }
    var i = byteLength2 - 1;
    var mul = 1;
    var sub = 0;
    this[offset + i] = value & 255;
    while (--i >= 0 && (mul *= 256)) {
      if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
        sub = 1;
      }
      this[offset + i] = (value / mul >> 0) - sub & 255;
    }
    return offset + byteLength2;
  };
  Buffer.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 1, 127, -128);
    if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
    if (value < 0) value = 255 + value + 1;
    this[offset] = value & 255;
    return offset + 1;
  };
  Buffer.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = value & 255;
      this[offset + 1] = value >>> 8;
    } else {
      objectWriteUInt16(this, value, offset, true);
    }
    return offset + 2;
  };
  Buffer.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = value >>> 8;
      this[offset + 1] = value & 255;
    } else {
      objectWriteUInt16(this, value, offset, false);
    }
    return offset + 2;
  };
  Buffer.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = value & 255;
      this[offset + 1] = value >>> 8;
      this[offset + 2] = value >>> 16;
      this[offset + 3] = value >>> 24;
    } else {
      objectWriteUInt32(this, value, offset, true);
    }
    return offset + 4;
  };
  Buffer.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
    if (value < 0) value = 4294967295 + value + 1;
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = value >>> 24;
      this[offset + 1] = value >>> 16;
      this[offset + 2] = value >>> 8;
      this[offset + 3] = value & 255;
    } else {
      objectWriteUInt32(this, value, offset, false);
    }
    return offset + 4;
  };
  function checkIEEE754(buf, value, offset, ext, max, min) {
    if (offset + ext > buf.length) throw new RangeError("Index out of range");
    if (offset < 0) throw new RangeError("Index out of range");
  }
  function writeFloat(buf, value, offset, littleEndian, noAssert) {
    if (!noAssert) {
      checkIEEE754(buf, value, offset, 4);
    }
    write(buf, value, offset, littleEndian, 23, 4);
    return offset + 4;
  }
  Buffer.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
    return writeFloat(this, value, offset, true, noAssert);
  };
  Buffer.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
    return writeFloat(this, value, offset, false, noAssert);
  };
  function writeDouble(buf, value, offset, littleEndian, noAssert) {
    if (!noAssert) {
      checkIEEE754(buf, value, offset, 8);
    }
    write(buf, value, offset, littleEndian, 52, 8);
    return offset + 8;
  }
  Buffer.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
    return writeDouble(this, value, offset, true, noAssert);
  };
  Buffer.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
    return writeDouble(this, value, offset, false, noAssert);
  };
  Buffer.prototype.copy = function copy(target2, targetStart, start, end) {
    if (!start) start = 0;
    if (!end && end !== 0) end = this.length;
    if (targetStart >= target2.length) targetStart = target2.length;
    if (!targetStart) targetStart = 0;
    if (end > 0 && end < start) end = start;
    if (end === start) return 0;
    if (target2.length === 0 || this.length === 0) return 0;
    if (targetStart < 0) {
      throw new RangeError("targetStart out of bounds");
    }
    if (start < 0 || start >= this.length) throw new RangeError("sourceStart out of bounds");
    if (end < 0) throw new RangeError("sourceEnd out of bounds");
    if (end > this.length) end = this.length;
    if (target2.length - targetStart < end - start) {
      end = target2.length - targetStart + start;
    }
    var len = end - start;
    var i;
    if (this === target2 && start < targetStart && targetStart < end) {
      for (i = len - 1; i >= 0; --i) {
        target2[i + targetStart] = this[i + start];
      }
    } else if (len < 1e3 || !Buffer.TYPED_ARRAY_SUPPORT) {
      for (i = 0; i < len; ++i) {
        target2[i + targetStart] = this[i + start];
      }
    } else {
      Uint8Array.prototype.set.call(
        target2,
        this.subarray(start, start + len),
        targetStart
      );
    }
    return len;
  };
  Buffer.prototype.fill = function fill(val, start, end, encoding) {
    if (typeof val === "string") {
      if (typeof start === "string") {
        encoding = start;
        start = 0;
        end = this.length;
      } else if (typeof end === "string") {
        encoding = end;
        end = this.length;
      }
      if (val.length === 1) {
        var code = val.charCodeAt(0);
        if (code < 256) {
          val = code;
        }
      }
      if (encoding !== void 0 && typeof encoding !== "string") {
        throw new TypeError("encoding must be a string");
      }
      if (typeof encoding === "string" && !Buffer.isEncoding(encoding)) {
        throw new TypeError("Unknown encoding: " + encoding);
      }
    } else if (typeof val === "number") {
      val = val & 255;
    }
    if (start < 0 || this.length < start || this.length < end) {
      throw new RangeError("Out of range index");
    }
    if (end <= start) {
      return this;
    }
    start = start >>> 0;
    end = end === void 0 ? this.length : end >>> 0;
    if (!val) val = 0;
    var i;
    if (typeof val === "number") {
      for (i = start; i < end; ++i) {
        this[i] = val;
      }
    } else {
      var bytes = internalIsBuffer(val) ? val : utf8ToBytes(new Buffer(val, encoding).toString());
      var len = bytes.length;
      for (i = 0; i < end - start; ++i) {
        this[i + start] = bytes[i % len];
      }
    }
    return this;
  };
  var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g;
  function base64clean(str) {
    str = stringtrim(str).replace(INVALID_BASE64_RE, "");
    if (str.length < 2) return "";
    while (str.length % 4 !== 0) {
      str = str + "=";
    }
    return str;
  }
  function stringtrim(str) {
    if (str.trim) return str.trim();
    return str.replace(/^\s+|\s+$/g, "");
  }
  function toHex(n) {
    if (n < 16) return "0" + n.toString(16);
    return n.toString(16);
  }
  function utf8ToBytes(string, units) {
    units = units || Infinity;
    var codePoint;
    var length = string.length;
    var leadSurrogate = null;
    var bytes = [];
    for (var i = 0; i < length; ++i) {
      codePoint = string.charCodeAt(i);
      if (codePoint > 55295 && codePoint < 57344) {
        if (!leadSurrogate) {
          if (codePoint > 56319) {
            if ((units -= 3) > -1) bytes.push(239, 191, 189);
            continue;
          } else if (i + 1 === length) {
            if ((units -= 3) > -1) bytes.push(239, 191, 189);
            continue;
          }
          leadSurrogate = codePoint;
          continue;
        }
        if (codePoint < 56320) {
          if ((units -= 3) > -1) bytes.push(239, 191, 189);
          leadSurrogate = codePoint;
          continue;
        }
        codePoint = (leadSurrogate - 55296 << 10 | codePoint - 56320) + 65536;
      } else if (leadSurrogate) {
        if ((units -= 3) > -1) bytes.push(239, 191, 189);
      }
      leadSurrogate = null;
      if (codePoint < 128) {
        if ((units -= 1) < 0) break;
        bytes.push(codePoint);
      } else if (codePoint < 2048) {
        if ((units -= 2) < 0) break;
        bytes.push(
          codePoint >> 6 | 192,
          codePoint & 63 | 128
        );
      } else if (codePoint < 65536) {
        if ((units -= 3) < 0) break;
        bytes.push(
          codePoint >> 12 | 224,
          codePoint >> 6 & 63 | 128,
          codePoint & 63 | 128
        );
      } else if (codePoint < 1114112) {
        if ((units -= 4) < 0) break;
        bytes.push(
          codePoint >> 18 | 240,
          codePoint >> 12 & 63 | 128,
          codePoint >> 6 & 63 | 128,
          codePoint & 63 | 128
        );
      } else {
        throw new Error("Invalid code point");
      }
    }
    return bytes;
  }
  function asciiToBytes(str) {
    var byteArray = [];
    for (var i = 0; i < str.length; ++i) {
      byteArray.push(str.charCodeAt(i) & 255);
    }
    return byteArray;
  }
  function utf16leToBytes(str, units) {
    var c, hi, lo;
    var byteArray = [];
    for (var i = 0; i < str.length; ++i) {
      if ((units -= 2) < 0) break;
      c = str.charCodeAt(i);
      hi = c >> 8;
      lo = c % 256;
      byteArray.push(lo);
      byteArray.push(hi);
    }
    return byteArray;
  }
  function base64ToBytes(str) {
    return toByteArray(base64clean(str));
  }
  function blitBuffer(src, dst, offset, length) {
    for (var i = 0; i < length; ++i) {
      if (i + offset >= dst.length || i >= src.length) break;
      dst[i + offset] = src[i];
    }
    return i;
  }
  function isnan(val) {
    return val !== val;
  }
  function isBuffer(obj) {
    return obj != null && (!!obj._isBuffer || isFastBuffer(obj) || isSlowBuffer(obj));
  }
  function isFastBuffer(obj) {
    return !!obj.constructor && typeof obj.constructor.isBuffer === "function" && obj.constructor.isBuffer(obj);
  }
  function isSlowBuffer(obj) {
    return typeof obj.readFloatLE === "function" && typeof obj.slice === "function" && isFastBuffer(obj.slice(0, 0));
  }
  var CsvError = class _CsvError extends Error {
    constructor(code, message, options, ...contexts) {
      if (Array.isArray(message)) message = message.join(" ").trim();
      super(message);
      if (Error.captureStackTrace !== void 0) {
        Error.captureStackTrace(this, _CsvError);
      }
      this.code = code;
      for (const context of contexts) {
        for (const key in context) {
          const value = context[key];
          this[key] = isBuffer(value) ? value.toString(options.encoding) : value == null ? value : JSON.parse(JSON.stringify(value));
        }
      }
    }
  };
  var is_object = function(obj) {
    return typeof obj === "object" && obj !== null && !Array.isArray(obj);
  };
  var normalize_columns_array = function(columns) {
    const normalizedColumns = [];
    for (let i = 0, l = columns.length; i < l; i++) {
      const column = columns[i];
      if (column === void 0 || column === null || column === false) {
        normalizedColumns[i] = { disabled: true };
      } else if (typeof column === "string") {
        normalizedColumns[i] = { name: column };
      } else if (is_object(column)) {
        if (typeof column.name !== "string") {
          throw new CsvError("CSV_OPTION_COLUMNS_MISSING_NAME", [
            "Option columns missing name:",
            `property "name" is required at position ${i}`,
            "when column is an object literal"
          ]);
        }
        normalizedColumns[i] = column;
      } else {
        throw new CsvError("CSV_INVALID_COLUMN_DEFINITION", [
          "Invalid column definition:",
          "expect a string or a literal object,",
          `got ${JSON.stringify(column)} at position ${i}`
        ]);
      }
    }
    return normalizedColumns;
  };
  var ResizeableBuffer = class {
    constructor(size = 100) {
      this.size = size;
      this.length = 0;
      this.buf = Buffer.allocUnsafe(size);
    }
    prepend(val) {
      if (isBuffer(val)) {
        const length = this.length + val.length;
        if (length >= this.size) {
          this.resize();
          if (length >= this.size) {
            throw Error("INVALID_BUFFER_STATE");
          }
        }
        const buf = this.buf;
        this.buf = Buffer.allocUnsafe(this.size);
        val.copy(this.buf, 0);
        buf.copy(this.buf, val.length);
        this.length += val.length;
      } else {
        const length = this.length++;
        if (length === this.size) {
          this.resize();
        }
        const buf = this.clone();
        this.buf[0] = val;
        buf.copy(this.buf, 1, 0, length);
      }
    }
    append(val) {
      const length = this.length++;
      if (length === this.size) {
        this.resize();
      }
      this.buf[length] = val;
    }
    clone() {
      return Buffer.from(this.buf.slice(0, this.length));
    }
    resize() {
      const length = this.length;
      this.size = this.size * 2;
      const buf = Buffer.allocUnsafe(this.size);
      this.buf.copy(buf, 0, 0, length);
      this.buf = buf;
    }
    toString(encoding) {
      if (encoding) {
        return this.buf.slice(0, this.length).toString(encoding);
      } else {
        return Uint8Array.prototype.slice.call(this.buf.slice(0, this.length));
      }
    }
    toJSON() {
      return this.toString("utf8");
    }
    reset() {
      this.length = 0;
    }
  };
  var np = 12;
  var cr$1 = 13;
  var nl$1 = 10;
  var space = 32;
  var tab = 9;
  var init_state = function(options) {
    return {
      bomSkipped: false,
      bufBytesStart: 0,
      castField: options.cast_function,
      commenting: false,
      // Current error encountered by a record
      error: void 0,
      enabled: options.from_line === 1,
      escaping: false,
      escapeIsQuote: isBuffer(options.escape) && isBuffer(options.quote) && Buffer.compare(options.escape, options.quote) === 0,
      // columns can be `false`, `true`, `Array`
      expectedRecordLength: Array.isArray(options.columns) ? options.columns.length : void 0,
      field: new ResizeableBuffer(20),
      firstLineToHeaders: options.cast_first_line_to_header,
      needMoreDataSize: Math.max(
        // Skip if the remaining buffer smaller than comment
        options.comment !== null ? options.comment.length : 0,
        ...options.delimiter.map((delimiter) => delimiter.length),
        // Skip if the remaining buffer can be escape sequence
        options.quote !== null ? options.quote.length : 0
      ),
      previousBuf: void 0,
      quoting: false,
      stop: false,
      rawBuffer: new ResizeableBuffer(100),
      record: [],
      recordHasError: false,
      record_length: 0,
      recordDelimiterMaxLength: options.record_delimiter.length === 0 ? 0 : Math.max(...options.record_delimiter.map((v) => v.length)),
      trimChars: [
        Buffer.from(" ", options.encoding)[0],
        Buffer.from("	", options.encoding)[0]
      ],
      wasQuoting: false,
      wasRowDelimiter: false,
      timchars: [
        Buffer.from(Buffer.from([cr$1], "utf8").toString(), options.encoding),
        Buffer.from(Buffer.from([nl$1], "utf8").toString(), options.encoding),
        Buffer.from(Buffer.from([np], "utf8").toString(), options.encoding),
        Buffer.from(Buffer.from([space], "utf8").toString(), options.encoding),
        Buffer.from(Buffer.from([tab], "utf8").toString(), options.encoding)
      ]
    };
  };
  var underscore = function(str) {
    return str.replace(/([A-Z])/g, function(_, match) {
      return "_" + match.toLowerCase();
    });
  };
  var normalize_options = function(opts) {
    const options = {};
    for (const opt in opts) {
      options[underscore(opt)] = opts[opt];
    }
    if (options.encoding === void 0 || options.encoding === true) {
      options.encoding = "utf8";
    } else if (options.encoding === null || options.encoding === false) {
      options.encoding = null;
    } else if (typeof options.encoding !== "string" && options.encoding !== null) {
      throw new CsvError(
        "CSV_INVALID_OPTION_ENCODING",
        [
          "Invalid option encoding:",
          "encoding must be a string or null to return a buffer,",
          `got ${JSON.stringify(options.encoding)}`
        ],
        options
      );
    }
    if (options.bom === void 0 || options.bom === null || options.bom === false) {
      options.bom = false;
    } else if (options.bom !== true) {
      throw new CsvError(
        "CSV_INVALID_OPTION_BOM",
        [
          "Invalid option bom:",
          "bom must be true,",
          `got ${JSON.stringify(options.bom)}`
        ],
        options
      );
    }
    options.cast_function = null;
    if (options.cast === void 0 || options.cast === null || options.cast === false || options.cast === "") {
      options.cast = void 0;
    } else if (typeof options.cast === "function") {
      options.cast_function = options.cast;
      options.cast = true;
    } else if (options.cast !== true) {
      throw new CsvError(
        "CSV_INVALID_OPTION_CAST",
        [
          "Invalid option cast:",
          "cast must be true or a function,",
          `got ${JSON.stringify(options.cast)}`
        ],
        options
      );
    }
    if (options.cast_date === void 0 || options.cast_date === null || options.cast_date === false || options.cast_date === "") {
      options.cast_date = false;
    } else if (options.cast_date === true) {
      options.cast_date = function(value) {
        const date = Date.parse(value);
        return !isNaN(date) ? new Date(date) : value;
      };
    } else if (typeof options.cast_date !== "function") {
      throw new CsvError(
        "CSV_INVALID_OPTION_CAST_DATE",
        [
          "Invalid option cast_date:",
          "cast_date must be true or a function,",
          `got ${JSON.stringify(options.cast_date)}`
        ],
        options
      );
    }
    options.cast_first_line_to_header = null;
    if (options.columns === true) {
      options.cast_first_line_to_header = void 0;
    } else if (typeof options.columns === "function") {
      options.cast_first_line_to_header = options.columns;
      options.columns = true;
    } else if (Array.isArray(options.columns)) {
      options.columns = normalize_columns_array(options.columns);
    } else if (options.columns === void 0 || options.columns === null || options.columns === false) {
      options.columns = false;
    } else {
      throw new CsvError(
        "CSV_INVALID_OPTION_COLUMNS",
        [
          "Invalid option columns:",
          "expect an array, a function or true,",
          `got ${JSON.stringify(options.columns)}`
        ],
        options
      );
    }
    if (options.group_columns_by_name === void 0 || options.group_columns_by_name === null || options.group_columns_by_name === false) {
      options.group_columns_by_name = false;
    } else if (options.group_columns_by_name !== true) {
      throw new CsvError(
        "CSV_INVALID_OPTION_GROUP_COLUMNS_BY_NAME",
        [
          "Invalid option group_columns_by_name:",
          "expect an boolean,",
          `got ${JSON.stringify(options.group_columns_by_name)}`
        ],
        options
      );
    } else if (options.columns === false) {
      throw new CsvError(
        "CSV_INVALID_OPTION_GROUP_COLUMNS_BY_NAME",
        [
          "Invalid option group_columns_by_name:",
          "the `columns` mode must be activated."
        ],
        options
      );
    }
    if (options.comment === void 0 || options.comment === null || options.comment === false || options.comment === "") {
      options.comment = null;
    } else {
      if (typeof options.comment === "string") {
        options.comment = Buffer.from(options.comment, options.encoding);
      }
      if (!isBuffer(options.comment)) {
        throw new CsvError(
          "CSV_INVALID_OPTION_COMMENT",
          [
            "Invalid option comment:",
            "comment must be a buffer or a string,",
            `got ${JSON.stringify(options.comment)}`
          ],
          options
        );
      }
    }
    if (options.comment_no_infix === void 0 || options.comment_no_infix === null || options.comment_no_infix === false) {
      options.comment_no_infix = false;
    } else if (options.comment_no_infix !== true) {
      throw new CsvError(
        "CSV_INVALID_OPTION_COMMENT",
        [
          "Invalid option comment_no_infix:",
          "value must be a boolean,",
          `got ${JSON.stringify(options.comment_no_infix)}`
        ],
        options
      );
    }
    const delimiter_json = JSON.stringify(options.delimiter);
    if (!Array.isArray(options.delimiter))
      options.delimiter = [options.delimiter];
    if (options.delimiter.length === 0) {
      throw new CsvError(
        "CSV_INVALID_OPTION_DELIMITER",
        [
          "Invalid option delimiter:",
          "delimiter must be a non empty string or buffer or array of string|buffer,",
          `got ${delimiter_json}`
        ],
        options
      );
    }
    options.delimiter = options.delimiter.map(function(delimiter) {
      if (delimiter === void 0 || delimiter === null || delimiter === false) {
        return Buffer.from(",", options.encoding);
      }
      if (typeof delimiter === "string") {
        delimiter = Buffer.from(delimiter, options.encoding);
      }
      if (!isBuffer(delimiter) || delimiter.length === 0) {
        throw new CsvError(
          "CSV_INVALID_OPTION_DELIMITER",
          [
            "Invalid option delimiter:",
            "delimiter must be a non empty string or buffer or array of string|buffer,",
            `got ${delimiter_json}`
          ],
          options
        );
      }
      return delimiter;
    });
    if (options.escape === void 0 || options.escape === true) {
      options.escape = Buffer.from('"', options.encoding);
    } else if (typeof options.escape === "string") {
      options.escape = Buffer.from(options.escape, options.encoding);
    } else if (options.escape === null || options.escape === false) {
      options.escape = null;
    }
    if (options.escape !== null) {
      if (!isBuffer(options.escape)) {
        throw new Error(
          `Invalid Option: escape must be a buffer, a string or a boolean, got ${JSON.stringify(options.escape)}`
        );
      }
    }
    if (options.from === void 0 || options.from === null) {
      options.from = 1;
    } else {
      if (typeof options.from === "string" && /\d+/.test(options.from)) {
        options.from = parseInt(options.from);
      }
      if (Number.isInteger(options.from)) {
        if (options.from < 0) {
          throw new Error(
            `Invalid Option: from must be a positive integer, got ${JSON.stringify(opts.from)}`
          );
        }
      } else {
        throw new Error(
          `Invalid Option: from must be an integer, got ${JSON.stringify(options.from)}`
        );
      }
    }
    if (options.from_line === void 0 || options.from_line === null) {
      options.from_line = 1;
    } else {
      if (typeof options.from_line === "string" && /\d+/.test(options.from_line)) {
        options.from_line = parseInt(options.from_line);
      }
      if (Number.isInteger(options.from_line)) {
        if (options.from_line <= 0) {
          throw new Error(
            `Invalid Option: from_line must be a positive integer greater than 0, got ${JSON.stringify(opts.from_line)}`
          );
        }
      } else {
        throw new Error(
          `Invalid Option: from_line must be an integer, got ${JSON.stringify(opts.from_line)}`
        );
      }
    }
    if (options.ignore_last_delimiters === void 0 || options.ignore_last_delimiters === null) {
      options.ignore_last_delimiters = false;
    } else if (typeof options.ignore_last_delimiters === "number") {
      options.ignore_last_delimiters = Math.floor(options.ignore_last_delimiters);
      if (options.ignore_last_delimiters === 0) {
        options.ignore_last_delimiters = false;
      }
    } else if (typeof options.ignore_last_delimiters !== "boolean") {
      throw new CsvError(
        "CSV_INVALID_OPTION_IGNORE_LAST_DELIMITERS",
        [
          "Invalid option `ignore_last_delimiters`:",
          "the value must be a boolean value or an integer,",
          `got ${JSON.stringify(options.ignore_last_delimiters)}`
        ],
        options
      );
    }
    if (options.ignore_last_delimiters === true && options.columns === false) {
      throw new CsvError(
        "CSV_IGNORE_LAST_DELIMITERS_REQUIRES_COLUMNS",
        [
          "The option `ignore_last_delimiters`",
          "requires the activation of the `columns` option"
        ],
        options
      );
    }
    if (options.info === void 0 || options.info === null || options.info === false) {
      options.info = false;
    } else if (options.info !== true) {
      throw new Error(
        `Invalid Option: info must be true, got ${JSON.stringify(options.info)}`
      );
    }
    if (options.max_record_size === void 0 || options.max_record_size === null || options.max_record_size === false) {
      options.max_record_size = 0;
    } else if (Number.isInteger(options.max_record_size) && options.max_record_size >= 0) ;
    else if (typeof options.max_record_size === "string" && /\d+/.test(options.max_record_size)) {
      options.max_record_size = parseInt(options.max_record_size);
    } else {
      throw new Error(
        `Invalid Option: max_record_size must be a positive integer, got ${JSON.stringify(options.max_record_size)}`
      );
    }
    if (options.objname === void 0 || options.objname === null || options.objname === false) {
      options.objname = void 0;
    } else if (isBuffer(options.objname)) {
      if (options.objname.length === 0) {
        throw new Error(`Invalid Option: objname must be a non empty buffer`);
      }
      if (options.encoding === null) ;
      else {
        options.objname = options.objname.toString(options.encoding);
      }
    } else if (typeof options.objname === "string") {
      if (options.objname.length === 0) {
        throw new Error(`Invalid Option: objname must be a non empty string`);
      }
    } else if (typeof options.objname === "number") ;
    else {
      throw new Error(
        `Invalid Option: objname must be a string or a buffer, got ${options.objname}`
      );
    }
    if (options.objname !== void 0) {
      if (typeof options.objname === "number") {
        if (options.columns !== false) {
          throw Error(
            "Invalid Option: objname index cannot be combined with columns or be defined as a field"
          );
        }
      } else {
        if (options.columns === false) {
          throw Error(
            "Invalid Option: objname field must be combined with columns or be defined as an index"
          );
        }
      }
    }
    if (options.on_record === void 0 || options.on_record === null) {
      options.on_record = void 0;
    } else if (typeof options.on_record !== "function") {
      throw new CsvError(
        "CSV_INVALID_OPTION_ON_RECORD",
        [
          "Invalid option `on_record`:",
          "expect a function,",
          `got ${JSON.stringify(options.on_record)}`
        ],
        options
      );
    }
    if (options.on_skip !== void 0 && options.on_skip !== null && typeof options.on_skip !== "function") {
      throw new Error(
        `Invalid Option: on_skip must be a function, got ${JSON.stringify(options.on_skip)}`
      );
    }
    if (options.quote === null || options.quote === false || options.quote === "") {
      options.quote = null;
    } else {
      if (options.quote === void 0 || options.quote === true) {
        options.quote = Buffer.from('"', options.encoding);
      } else if (typeof options.quote === "string") {
        options.quote = Buffer.from(options.quote, options.encoding);
      }
      if (!isBuffer(options.quote)) {
        throw new Error(
          `Invalid Option: quote must be a buffer or a string, got ${JSON.stringify(options.quote)}`
        );
      }
    }
    if (options.raw === void 0 || options.raw === null || options.raw === false) {
      options.raw = false;
    } else if (options.raw !== true) {
      throw new Error(
        `Invalid Option: raw must be true, got ${JSON.stringify(options.raw)}`
      );
    }
    if (options.record_delimiter === void 0) {
      options.record_delimiter = [];
    } else if (typeof options.record_delimiter === "string" || isBuffer(options.record_delimiter)) {
      if (options.record_delimiter.length === 0) {
        throw new CsvError(
          "CSV_INVALID_OPTION_RECORD_DELIMITER",
          [
            "Invalid option `record_delimiter`:",
            "value must be a non empty string or buffer,",
            `got ${JSON.stringify(options.record_delimiter)}`
          ],
          options
        );
      }
      options.record_delimiter = [options.record_delimiter];
    } else if (!Array.isArray(options.record_delimiter)) {
      throw new CsvError(
        "CSV_INVALID_OPTION_RECORD_DELIMITER",
        [
          "Invalid option `record_delimiter`:",
          "value must be a string, a buffer or array of string|buffer,",
          `got ${JSON.stringify(options.record_delimiter)}`
        ],
        options
      );
    }
    options.record_delimiter = options.record_delimiter.map(function(rd, i) {
      if (typeof rd !== "string" && !isBuffer(rd)) {
        throw new CsvError(
          "CSV_INVALID_OPTION_RECORD_DELIMITER",
          [
            "Invalid option `record_delimiter`:",
            "value must be a string, a buffer or array of string|buffer",
            `at index ${i},`,
            `got ${JSON.stringify(rd)}`
          ],
          options
        );
      } else if (rd.length === 0) {
        throw new CsvError(
          "CSV_INVALID_OPTION_RECORD_DELIMITER",
          [
            "Invalid option `record_delimiter`:",
            "value must be a non empty string or buffer",
            `at index ${i},`,
            `got ${JSON.stringify(rd)}`
          ],
          options
        );
      }
      if (typeof rd === "string") {
        rd = Buffer.from(rd, options.encoding);
      }
      return rd;
    });
    if (typeof options.relax_column_count === "boolean") ;
    else if (options.relax_column_count === void 0 || options.relax_column_count === null) {
      options.relax_column_count = false;
    } else {
      throw new Error(
        `Invalid Option: relax_column_count must be a boolean, got ${JSON.stringify(options.relax_column_count)}`
      );
    }
    if (typeof options.relax_column_count_less === "boolean") ;
    else if (options.relax_column_count_less === void 0 || options.relax_column_count_less === null) {
      options.relax_column_count_less = false;
    } else {
      throw new Error(
        `Invalid Option: relax_column_count_less must be a boolean, got ${JSON.stringify(options.relax_column_count_less)}`
      );
    }
    if (typeof options.relax_column_count_more === "boolean") ;
    else if (options.relax_column_count_more === void 0 || options.relax_column_count_more === null) {
      options.relax_column_count_more = false;
    } else {
      throw new Error(
        `Invalid Option: relax_column_count_more must be a boolean, got ${JSON.stringify(options.relax_column_count_more)}`
      );
    }
    if (typeof options.relax_quotes === "boolean") ;
    else if (options.relax_quotes === void 0 || options.relax_quotes === null) {
      options.relax_quotes = false;
    } else {
      throw new Error(
        `Invalid Option: relax_quotes must be a boolean, got ${JSON.stringify(options.relax_quotes)}`
      );
    }
    if (typeof options.skip_empty_lines === "boolean") ;
    else if (options.skip_empty_lines === void 0 || options.skip_empty_lines === null) {
      options.skip_empty_lines = false;
    } else {
      throw new Error(
        `Invalid Option: skip_empty_lines must be a boolean, got ${JSON.stringify(options.skip_empty_lines)}`
      );
    }
    if (typeof options.skip_records_with_empty_values === "boolean") ;
    else if (options.skip_records_with_empty_values === void 0 || options.skip_records_with_empty_values === null) {
      options.skip_records_with_empty_values = false;
    } else {
      throw new Error(
        `Invalid Option: skip_records_with_empty_values must be a boolean, got ${JSON.stringify(options.skip_records_with_empty_values)}`
      );
    }
    if (typeof options.skip_records_with_error === "boolean") ;
    else if (options.skip_records_with_error === void 0 || options.skip_records_with_error === null) {
      options.skip_records_with_error = false;
    } else {
      throw new Error(
        `Invalid Option: skip_records_with_error must be a boolean, got ${JSON.stringify(options.skip_records_with_error)}`
      );
    }
    if (options.rtrim === void 0 || options.rtrim === null || options.rtrim === false) {
      options.rtrim = false;
    } else if (options.rtrim !== true) {
      throw new Error(
        `Invalid Option: rtrim must be a boolean, got ${JSON.stringify(options.rtrim)}`
      );
    }
    if (options.ltrim === void 0 || options.ltrim === null || options.ltrim === false) {
      options.ltrim = false;
    } else if (options.ltrim !== true) {
      throw new Error(
        `Invalid Option: ltrim must be a boolean, got ${JSON.stringify(options.ltrim)}`
      );
    }
    if (options.trim === void 0 || options.trim === null || options.trim === false) {
      options.trim = false;
    } else if (options.trim !== true) {
      throw new Error(
        `Invalid Option: trim must be a boolean, got ${JSON.stringify(options.trim)}`
      );
    }
    if (options.trim === true && opts.ltrim !== false) {
      options.ltrim = true;
    } else if (options.ltrim !== true) {
      options.ltrim = false;
    }
    if (options.trim === true && opts.rtrim !== false) {
      options.rtrim = true;
    } else if (options.rtrim !== true) {
      options.rtrim = false;
    }
    if (options.to === void 0 || options.to === null) {
      options.to = -1;
    } else {
      if (typeof options.to === "string" && /\d+/.test(options.to)) {
        options.to = parseInt(options.to);
      }
      if (Number.isInteger(options.to)) {
        if (options.to <= 0) {
          throw new Error(
            `Invalid Option: to must be a positive integer greater than 0, got ${JSON.stringify(opts.to)}`
          );
        }
      } else {
        throw new Error(
          `Invalid Option: to must be an integer, got ${JSON.stringify(opts.to)}`
        );
      }
    }
    if (options.to_line === void 0 || options.to_line === null) {
      options.to_line = -1;
    } else {
      if (typeof options.to_line === "string" && /\d+/.test(options.to_line)) {
        options.to_line = parseInt(options.to_line);
      }
      if (Number.isInteger(options.to_line)) {
        if (options.to_line <= 0) {
          throw new Error(
            `Invalid Option: to_line must be a positive integer greater than 0, got ${JSON.stringify(opts.to_line)}`
          );
        }
      } else {
        throw new Error(
          `Invalid Option: to_line must be an integer, got ${JSON.stringify(opts.to_line)}`
        );
      }
    }
    return options;
  };
  var isRecordEmpty = function(record) {
    return record.every(
      (field) => field == null || field.toString && field.toString().trim() === ""
    );
  };
  var cr = 13;
  var nl = 10;
  var boms = {
    // Note, the following are equals:
    // Buffer.from("\ufeff")
    // Buffer.from([239, 187, 191])
    // Buffer.from('EFBBBF', 'hex')
    utf8: Buffer.from([239, 187, 191]),
    // Note, the following are equals:
    // Buffer.from "\ufeff", 'utf16le
    // Buffer.from([255, 254])
    utf16le: Buffer.from([255, 254])
  };
  var transform = function(original_options = {}) {
    const info = {
      bytes: 0,
      comment_lines: 0,
      empty_lines: 0,
      invalid_field_length: 0,
      lines: 1,
      records: 0
    };
    const options = normalize_options(original_options);
    return {
      info,
      original_options,
      options,
      state: init_state(options),
      __needMoreData: function(i, bufLen, end) {
        if (end) return false;
        const { encoding, escape, quote } = this.options;
        const { quoting, needMoreDataSize, recordDelimiterMaxLength } = this.state;
        const numOfCharLeft = bufLen - i - 1;
        const requiredLength = Math.max(
          needMoreDataSize,
          // Skip if the remaining buffer smaller than record delimiter
          // If "record_delimiter" is yet to be discovered:
          // 1. It is equals to `[]` and "recordDelimiterMaxLength" equals `0`
          // 2. We set the length to windows line ending in the current encoding
          // Note, that encoding is known from user or bom discovery at that point
          // recordDelimiterMaxLength,
          recordDelimiterMaxLength === 0 ? Buffer.from("\r\n", encoding).length : recordDelimiterMaxLength,
          // Skip if remaining buffer can be an escaped quote
          quoting ? (escape === null ? 0 : escape.length) + quote.length : 0,
          // Skip if remaining buffer can be record delimiter following the closing quote
          quoting ? quote.length + recordDelimiterMaxLength : 0
        );
        return numOfCharLeft < requiredLength;
      },
      // Central parser implementation
      parse: function(nextBuf, end, push, close) {
        const {
          bom,
          comment_no_infix,
          encoding,
          from_line,
          ltrim,
          max_record_size,
          raw,
          relax_quotes,
          rtrim,
          skip_empty_lines,
          to,
          to_line
        } = this.options;
        let { comment, escape, quote, record_delimiter } = this.options;
        const { bomSkipped, previousBuf, rawBuffer, escapeIsQuote } = this.state;
        let buf;
        if (previousBuf === void 0) {
          if (nextBuf === void 0) {
            close();
            return;
          } else {
            buf = nextBuf;
          }
        } else if (previousBuf !== void 0 && nextBuf === void 0) {
          buf = previousBuf;
        } else {
          buf = Buffer.concat([previousBuf, nextBuf]);
        }
        if (bomSkipped === false) {
          if (bom === false) {
            this.state.bomSkipped = true;
          } else if (buf.length < 3) {
            if (end === false) {
              this.state.previousBuf = buf;
              return;
            }
          } else {
            for (const encoding2 in boms) {
              if (boms[encoding2].compare(buf, 0, boms[encoding2].length) === 0) {
                const bomLength = boms[encoding2].length;
                this.state.bufBytesStart += bomLength;
                buf = buf.slice(bomLength);
                this.options = normalize_options({
                  ...this.original_options,
                  encoding: encoding2
                });
                ({ comment, escape, quote } = this.options);
                break;
              }
            }
            this.state.bomSkipped = true;
          }
        }
        const bufLen = buf.length;
        let pos;
        for (pos = 0; pos < bufLen; pos++) {
          if (this.__needMoreData(pos, bufLen, end)) {
            break;
          }
          if (this.state.wasRowDelimiter === true) {
            this.info.lines++;
            this.state.wasRowDelimiter = false;
          }
          if (to_line !== -1 && this.info.lines > to_line) {
            this.state.stop = true;
            close();
            return;
          }
          if (this.state.quoting === false && record_delimiter.length === 0) {
            const record_delimiterCount = this.__autoDiscoverRecordDelimiter(
              buf,
              pos
            );
            if (record_delimiterCount) {
              record_delimiter = this.options.record_delimiter;
            }
          }
          const chr = buf[pos];
          if (raw === true) {
            rawBuffer.append(chr);
          }
          if ((chr === cr || chr === nl) && this.state.wasRowDelimiter === false) {
            this.state.wasRowDelimiter = true;
          }
          if (this.state.escaping === true) {
            this.state.escaping = false;
          } else {
            if (escape !== null && this.state.quoting === true && this.__isEscape(buf, pos, chr) && pos + escape.length < bufLen) {
              if (escapeIsQuote) {
                if (this.__isQuote(buf, pos + escape.length)) {
                  this.state.escaping = true;
                  pos += escape.length - 1;
                  continue;
                }
              } else {
                this.state.escaping = true;
                pos += escape.length - 1;
                continue;
              }
            }
            if (this.state.commenting === false && this.__isQuote(buf, pos)) {
              if (this.state.quoting === true) {
                const nextChr = buf[pos + quote.length];
                const isNextChrTrimable = rtrim && this.__isCharTrimable(buf, pos + quote.length);
                const isNextChrComment = comment !== null && this.__compareBytes(comment, buf, pos + quote.length, nextChr);
                const isNextChrDelimiter = this.__isDelimiter(
                  buf,
                  pos + quote.length,
                  nextChr
                );
                const isNextChrRecordDelimiter = record_delimiter.length === 0 ? this.__autoDiscoverRecordDelimiter(buf, pos + quote.length) : this.__isRecordDelimiter(nextChr, buf, pos + quote.length);
                if (escape !== null && this.__isEscape(buf, pos, chr) && this.__isQuote(buf, pos + escape.length)) {
                  pos += escape.length - 1;
                } else if (!nextChr || isNextChrDelimiter || isNextChrRecordDelimiter || isNextChrComment || isNextChrTrimable) {
                  this.state.quoting = false;
                  this.state.wasQuoting = true;
                  pos += quote.length - 1;
                  continue;
                } else if (relax_quotes === false) {
                  const err = this.__error(
                    new CsvError(
                      "CSV_INVALID_CLOSING_QUOTE",
                      [
                        "Invalid Closing Quote:",
                        `got "${String.fromCharCode(nextChr)}"`,
                        `at line ${this.info.lines}`,
                        "instead of delimiter, record delimiter, trimable character",
                        "(if activated) or comment"
                      ],
                      this.options,
                      this.__infoField()
                    )
                  );
                  if (err !== void 0) return err;
                } else {
                  this.state.quoting = false;
                  this.state.wasQuoting = true;
                  this.state.field.prepend(quote);
                  pos += quote.length - 1;
                }
              } else {
                if (this.state.field.length !== 0) {
                  if (relax_quotes === false) {
                    const info2 = this.__infoField();
                    const bom2 = Object.keys(boms).map(
                      (b) => boms[b].equals(this.state.field.toString()) ? b : false
                    ).filter(Boolean)[0];
                    const err = this.__error(
                      new CsvError(
                        "INVALID_OPENING_QUOTE",
                        [
                          "Invalid Opening Quote:",
                          `a quote is found on field ${JSON.stringify(info2.column)} at line ${info2.lines}, value is ${JSON.stringify(this.state.field.toString(encoding))}`,
                          bom2 ? `(${bom2} bom)` : void 0
                        ],
                        this.options,
                        info2,
                        {
                          field: this.state.field
                        }
                      )
                    );
                    if (err !== void 0) return err;
                  }
                } else {
                  this.state.quoting = true;
                  pos += quote.length - 1;
                  continue;
                }
              }
            }
            if (this.state.quoting === false) {
              const recordDelimiterLength = this.__isRecordDelimiter(
                chr,
                buf,
                pos
              );
              if (recordDelimiterLength !== 0) {
                const skipCommentLine = this.state.commenting && this.state.wasQuoting === false && this.state.record.length === 0 && this.state.field.length === 0;
                if (skipCommentLine) {
                  this.info.comment_lines++;
                } else {
                  if (this.state.enabled === false && this.info.lines + (this.state.wasRowDelimiter === true ? 1 : 0) >= from_line) {
                    this.state.enabled = true;
                    this.__resetField();
                    this.__resetRecord();
                    pos += recordDelimiterLength - 1;
                    continue;
                  }
                  if (skip_empty_lines === true && this.state.wasQuoting === false && this.state.record.length === 0 && this.state.field.length === 0) {
                    this.info.empty_lines++;
                    pos += recordDelimiterLength - 1;
                    continue;
                  }
                  this.info.bytes = this.state.bufBytesStart + pos;
                  const errField = this.__onField();
                  if (errField !== void 0) return errField;
                  this.info.bytes = this.state.bufBytesStart + pos + recordDelimiterLength;
                  const errRecord = this.__onRecord(push);
                  if (errRecord !== void 0) return errRecord;
                  if (to !== -1 && this.info.records >= to) {
                    this.state.stop = true;
                    close();
                    return;
                  }
                }
                this.state.commenting = false;
                pos += recordDelimiterLength - 1;
                continue;
              }
              if (this.state.commenting) {
                continue;
              }
              if (comment !== null && (comment_no_infix === false || this.state.record.length === 0 && this.state.field.length === 0)) {
                const commentCount = this.__compareBytes(comment, buf, pos, chr);
                if (commentCount !== 0) {
                  this.state.commenting = true;
                  continue;
                }
              }
              const delimiterLength = this.__isDelimiter(buf, pos, chr);
              if (delimiterLength !== 0) {
                this.info.bytes = this.state.bufBytesStart + pos;
                const errField = this.__onField();
                if (errField !== void 0) return errField;
                pos += delimiterLength - 1;
                continue;
              }
            }
          }
          if (this.state.commenting === false) {
            if (max_record_size !== 0 && this.state.record_length + this.state.field.length > max_record_size) {
              return this.__error(
                new CsvError(
                  "CSV_MAX_RECORD_SIZE",
                  [
                    "Max Record Size:",
                    "record exceed the maximum number of tolerated bytes",
                    `of ${max_record_size}`,
                    `at line ${this.info.lines}`
                  ],
                  this.options,
                  this.__infoField()
                )
              );
            }
          }
          const lappend = ltrim === false || this.state.quoting === true || this.state.field.length !== 0 || !this.__isCharTrimable(buf, pos);
          const rappend = rtrim === false || this.state.wasQuoting === false;
          if (lappend === true && rappend === true) {
            this.state.field.append(chr);
          } else if (rtrim === true && !this.__isCharTrimable(buf, pos)) {
            return this.__error(
              new CsvError(
                "CSV_NON_TRIMABLE_CHAR_AFTER_CLOSING_QUOTE",
                [
                  "Invalid Closing Quote:",
                  "found non trimable byte after quote",
                  `at line ${this.info.lines}`
                ],
                this.options,
                this.__infoField()
              )
            );
          } else {
            if (lappend === false) {
              pos += this.__isCharTrimable(buf, pos) - 1;
            }
            continue;
          }
        }
        if (end === true) {
          if (this.state.quoting === true) {
            const err = this.__error(
              new CsvError(
                "CSV_QUOTE_NOT_CLOSED",
                [
                  "Quote Not Closed:",
                  `the parsing is finished with an opening quote at line ${this.info.lines}`
                ],
                this.options,
                this.__infoField()
              )
            );
            if (err !== void 0) return err;
          } else {
            if (this.state.wasQuoting === true || this.state.record.length !== 0 || this.state.field.length !== 0) {
              this.info.bytes = this.state.bufBytesStart + pos;
              const errField = this.__onField();
              if (errField !== void 0) return errField;
              const errRecord = this.__onRecord(push);
              if (errRecord !== void 0) return errRecord;
            } else if (this.state.wasRowDelimiter === true) {
              this.info.empty_lines++;
            } else if (this.state.commenting === true) {
              this.info.comment_lines++;
            }
          }
        } else {
          this.state.bufBytesStart += pos;
          this.state.previousBuf = buf.slice(pos);
        }
        if (this.state.wasRowDelimiter === true) {
          this.info.lines++;
          this.state.wasRowDelimiter = false;
        }
      },
      __onRecord: function(push) {
        const {
          columns,
          group_columns_by_name,
          encoding,
          info: info2,
          from: from2,
          relax_column_count,
          relax_column_count_less,
          relax_column_count_more,
          raw,
          skip_records_with_empty_values
        } = this.options;
        const { enabled, record } = this.state;
        if (enabled === false) {
          return this.__resetRecord();
        }
        const recordLength = record.length;
        if (columns === true) {
          if (skip_records_with_empty_values === true && isRecordEmpty(record)) {
            this.__resetRecord();
            return;
          }
          return this.__firstLineToColumns(record);
        }
        if (columns === false && this.info.records === 0) {
          this.state.expectedRecordLength = recordLength;
        }
        if (recordLength !== this.state.expectedRecordLength) {
          const err = columns === false ? new CsvError(
            "CSV_RECORD_INCONSISTENT_FIELDS_LENGTH",
            [
              "Invalid Record Length:",
              `expect ${this.state.expectedRecordLength},`,
              `got ${recordLength} on line ${this.info.lines}`
            ],
            this.options,
            this.__infoField(),
            {
              record
            }
          ) : new CsvError(
            "CSV_RECORD_INCONSISTENT_COLUMNS",
            [
              "Invalid Record Length:",
              `columns length is ${columns.length},`,
              // rename columns
              `got ${recordLength} on line ${this.info.lines}`
            ],
            this.options,
            this.__infoField(),
            {
              record
            }
          );
          if (relax_column_count === true || relax_column_count_less === true && recordLength < this.state.expectedRecordLength || relax_column_count_more === true && recordLength > this.state.expectedRecordLength) {
            this.info.invalid_field_length++;
            this.state.error = err;
          } else {
            const finalErr = this.__error(err);
            if (finalErr) return finalErr;
          }
        }
        if (skip_records_with_empty_values === true && isRecordEmpty(record)) {
          this.__resetRecord();
          return;
        }
        if (this.state.recordHasError === true) {
          this.__resetRecord();
          this.state.recordHasError = false;
          return;
        }
        this.info.records++;
        if (from2 === 1 || this.info.records >= from2) {
          const { objname } = this.options;
          if (columns !== false) {
            const obj = {};
            for (let i = 0, l = record.length; i < l; i++) {
              if (columns[i] === void 0 || columns[i].disabled) continue;
              if (group_columns_by_name === true && obj[columns[i].name] !== void 0) {
                if (Array.isArray(obj[columns[i].name])) {
                  obj[columns[i].name] = obj[columns[i].name].concat(record[i]);
                } else {
                  obj[columns[i].name] = [obj[columns[i].name], record[i]];
                }
              } else {
                obj[columns[i].name] = record[i];
              }
            }
            if (raw === true || info2 === true) {
              const extRecord = Object.assign(
                { record: obj },
                raw === true ? { raw: this.state.rawBuffer.toString(encoding) } : {},
                info2 === true ? { info: this.__infoRecord() } : {}
              );
              const err = this.__push(
                objname === void 0 ? extRecord : [obj[objname], extRecord],
                push
              );
              if (err) {
                return err;
              }
            } else {
              const err = this.__push(
                objname === void 0 ? obj : [obj[objname], obj],
                push
              );
              if (err) {
                return err;
              }
            }
          } else {
            if (raw === true || info2 === true) {
              const extRecord = Object.assign(
                { record },
                raw === true ? { raw: this.state.rawBuffer.toString(encoding) } : {},
                info2 === true ? { info: this.__infoRecord() } : {}
              );
              const err = this.__push(
                objname === void 0 ? extRecord : [record[objname], extRecord],
                push
              );
              if (err) {
                return err;
              }
            } else {
              const err = this.__push(
                objname === void 0 ? record : [record[objname], record],
                push
              );
              if (err) {
                return err;
              }
            }
          }
        }
        this.__resetRecord();
      },
      __firstLineToColumns: function(record) {
        const { firstLineToHeaders } = this.state;
        try {
          const headers = firstLineToHeaders === void 0 ? record : firstLineToHeaders.call(null, record);
          if (!Array.isArray(headers)) {
            return this.__error(
              new CsvError(
                "CSV_INVALID_COLUMN_MAPPING",
                [
                  "Invalid Column Mapping:",
                  "expect an array from column function,",
                  `got ${JSON.stringify(headers)}`
                ],
                this.options,
                this.__infoField(),
                {
                  headers
                }
              )
            );
          }
          const normalizedHeaders = normalize_columns_array(headers);
          this.state.expectedRecordLength = normalizedHeaders.length;
          this.options.columns = normalizedHeaders;
          this.__resetRecord();
          return;
        } catch (err) {
          return err;
        }
      },
      __resetRecord: function() {
        if (this.options.raw === true) {
          this.state.rawBuffer.reset();
        }
        this.state.error = void 0;
        this.state.record = [];
        this.state.record_length = 0;
      },
      __onField: function() {
        const { cast, encoding, rtrim, max_record_size } = this.options;
        const { enabled, wasQuoting } = this.state;
        if (enabled === false) {
          return this.__resetField();
        }
        let field = this.state.field.toString(encoding);
        if (rtrim === true && wasQuoting === false) {
          field = field.trimRight();
        }
        if (cast === true) {
          const [err, f] = this.__cast(field);
          if (err !== void 0) return err;
          field = f;
        }
        this.state.record.push(field);
        if (max_record_size !== 0 && typeof field === "string") {
          this.state.record_length += field.length;
        }
        this.__resetField();
      },
      __resetField: function() {
        this.state.field.reset();
        this.state.wasQuoting = false;
      },
      __push: function(record, push) {
        const { on_record } = this.options;
        if (on_record !== void 0) {
          const info2 = this.__infoRecord();
          try {
            record = on_record.call(null, record, info2);
          } catch (err) {
            return err;
          }
          if (record === void 0 || record === null) {
            return;
          }
        }
        push(record);
      },
      // Return a tuple with the error and the casted value
      __cast: function(field) {
        const { columns, relax_column_count } = this.options;
        const isColumns = Array.isArray(columns);
        if (isColumns === true && relax_column_count && this.options.columns.length <= this.state.record.length) {
          return [void 0, void 0];
        }
        if (this.state.castField !== null) {
          try {
            const info2 = this.__infoField();
            return [void 0, this.state.castField.call(null, field, info2)];
          } catch (err) {
            return [err];
          }
        }
        if (this.__isFloat(field)) {
          return [void 0, parseFloat(field)];
        } else if (this.options.cast_date !== false) {
          const info2 = this.__infoField();
          return [void 0, this.options.cast_date.call(null, field, info2)];
        }
        return [void 0, field];
      },
      // Helper to test if a character is a space or a line delimiter
      __isCharTrimable: function(buf, pos) {
        const isTrim = (buf2, pos2) => {
          const { timchars } = this.state;
          loop1: for (let i = 0; i < timchars.length; i++) {
            const timchar = timchars[i];
            for (let j = 0; j < timchar.length; j++) {
              if (timchar[j] !== buf2[pos2 + j]) continue loop1;
            }
            return timchar.length;
          }
          return 0;
        };
        return isTrim(buf, pos);
      },
      // Keep it in case we implement the `cast_int` option
      // __isInt(value){
      //   // return Number.isInteger(parseInt(value))
      //   // return !isNaN( parseInt( obj ) );
      //   return /^(\-|\+)?[1-9][0-9]*$/.test(value)
      // }
      __isFloat: function(value) {
        return value - parseFloat(value) + 1 >= 0;
      },
      __compareBytes: function(sourceBuf, targetBuf, targetPos, firstByte) {
        if (sourceBuf[0] !== firstByte) return 0;
        const sourceLength = sourceBuf.length;
        for (let i = 1; i < sourceLength; i++) {
          if (sourceBuf[i] !== targetBuf[targetPos + i]) return 0;
        }
        return sourceLength;
      },
      __isDelimiter: function(buf, pos, chr) {
        const { delimiter, ignore_last_delimiters } = this.options;
        if (ignore_last_delimiters === true && this.state.record.length === this.options.columns.length - 1) {
          return 0;
        } else if (ignore_last_delimiters !== false && typeof ignore_last_delimiters === "number" && this.state.record.length === ignore_last_delimiters - 1) {
          return 0;
        }
        loop1: for (let i = 0; i < delimiter.length; i++) {
          const del = delimiter[i];
          if (del[0] === chr) {
            for (let j = 1; j < del.length; j++) {
              if (del[j] !== buf[pos + j]) continue loop1;
            }
            return del.length;
          }
        }
        return 0;
      },
      __isRecordDelimiter: function(chr, buf, pos) {
        const { record_delimiter } = this.options;
        const recordDelimiterLength = record_delimiter.length;
        loop1: for (let i = 0; i < recordDelimiterLength; i++) {
          const rd = record_delimiter[i];
          const rdLength = rd.length;
          if (rd[0] !== chr) {
            continue;
          }
          for (let j = 1; j < rdLength; j++) {
            if (rd[j] !== buf[pos + j]) {
              continue loop1;
            }
          }
          return rd.length;
        }
        return 0;
      },
      __isEscape: function(buf, pos, chr) {
        const { escape } = this.options;
        if (escape === null) return false;
        const l = escape.length;
        if (escape[0] === chr) {
          for (let i = 0; i < l; i++) {
            if (escape[i] !== buf[pos + i]) {
              return false;
            }
          }
          return true;
        }
        return false;
      },
      __isQuote: function(buf, pos) {
        const { quote } = this.options;
        if (quote === null) return false;
        const l = quote.length;
        for (let i = 0; i < l; i++) {
          if (quote[i] !== buf[pos + i]) {
            return false;
          }
        }
        return true;
      },
      __autoDiscoverRecordDelimiter: function(buf, pos) {
        const { encoding } = this.options;
        const rds = [
          // Important, the windows line ending must be before mac os 9
          Buffer.from("\r\n", encoding),
          Buffer.from("\n", encoding),
          Buffer.from("\r", encoding)
        ];
        loop: for (let i = 0; i < rds.length; i++) {
          const l = rds[i].length;
          for (let j = 0; j < l; j++) {
            if (rds[i][j] !== buf[pos + j]) {
              continue loop;
            }
          }
          this.options.record_delimiter.push(rds[i]);
          this.state.recordDelimiterMaxLength = rds[i].length;
          return rds[i].length;
        }
        return 0;
      },
      __error: function(msg) {
        const { encoding, raw, skip_records_with_error } = this.options;
        const err = typeof msg === "string" ? new Error(msg) : msg;
        if (skip_records_with_error) {
          this.state.recordHasError = true;
          if (this.options.on_skip !== void 0) {
            this.options.on_skip(
              err,
              raw ? this.state.rawBuffer.toString(encoding) : void 0
            );
          }
          return void 0;
        } else {
          return err;
        }
      },
      __infoDataSet: function() {
        return {
          ...this.info,
          columns: this.options.columns
        };
      },
      __infoRecord: function() {
        const { columns, raw, encoding } = this.options;
        return {
          ...this.__infoDataSet(),
          error: this.state.error,
          header: columns === true,
          index: this.state.record.length,
          raw: raw ? this.state.rawBuffer.toString(encoding) : void 0
        };
      },
      __infoField: function() {
        const { columns } = this.options;
        const isColumns = Array.isArray(columns);
        return {
          ...this.__infoRecord(),
          column: isColumns === true ? columns.length > this.state.record.length ? columns[this.state.record.length].name : null : this.state.record.length,
          quoting: this.state.wasQuoting
        };
      }
    };
  };
  var parse = function(data, opts = {}) {
    if (typeof data === "string") {
      data = Buffer.from(data);
    }
    const records = opts && opts.objname ? {} : [];
    const parser = transform(opts);
    const push = (record) => {
      if (parser.options.objname === void 0) records.push(record);
      else {
        records[record[0]] = record[1];
      }
    };
    const close = () => {
    };
    const err1 = parser.parse(data, false, push, close);
    if (err1 !== void 0) throw err1;
    const err2 = parser.parse(void 0, true, push, close);
    if (err2 !== void 0) throw err2;
    return records;
  };

  // src/stackedBarChart.ts
  var CANVAS_WIDTH = 900;
  var CANVAS_HEIGHT = 500;
  var MARGIN_TOP = 60;
  var MARGIN_RIGHT = 60;
  var MARGIN_LEFT = 80;
  var MARGIN_BOTTOM = 60;
  var Y_GRID_COUNT = 6;
  var FRAME_WIDTH = CANVAS_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
  var FRAME_HEIGHT = CANVAS_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM;
  var CHART_BAR_WIDTH = 50;
  var UNIT_LIST = [
    {
      unit: "\u5146",
      value: 1e9
    },
    {
      unit: "\u5104",
      value: 1e6
    },
    {
      unit: "\u4E07",
      value: 1e4
    },
    {
      unit: "",
      value: 1
    }
  ];
  var getColorList = (num) => {
    const colorList = [];
    for (let i = 0; i < num; i++) {
      const max = 130;
      const baseColor = {
        r: Math.floor(Math.random() * max),
        g: Math.floor(Math.random() * max),
        b: Math.floor(Math.random() * max)
      };
      if (i % 3 === 0) {
        colorList.push({
          ...baseColor,
          r: baseColor.r + 255 - max
        });
      } else if (i % 3 === 1) {
        colorList.push({
          ...baseColor,
          g: baseColor.g + 255 - max
        });
      } else {
        colorList.push({
          ...baseColor,
          b: baseColor.b + 255 - max
        });
      }
    }
    return colorList;
  };
  var StackedBarChart = class {
    _canvas;
    _data;
    _filteredCategory;
    _currentChartPosition;
    _mousePosX;
    _isMouseDown;
    _offsetX;
    _scaleX;
    _title;
    _categoryColor;
    constructor() {
      this._offsetX = 0;
      this._scaleX = 1;
      this._title = "CSV\u30D5\u30A1\u30A4\u30EB\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044";
      this._canvas = document.createElement("canvas");
      this._canvas.width = CANVAS_WIDTH;
      this._canvas.height = CANVAS_HEIGHT;
      this._data = {
        headers: [],
        data: []
      };
      this._handleMouseDown = this._handleMouseDown.bind(this);
      this._handleMouseUp = this._handleMouseUp.bind(this);
      this._handleWheel = this._handleWheel.bind(this);
      this._handleMouseMove = this._handleMouseMove.bind(this);
      this._canvas.addEventListener("mousedown", this._handleMouseDown);
      this._canvas.addEventListener("mouseup", this._handleMouseUp);
      this._canvas.addEventListener("wheel", this._handleWheel);
      this._canvas.addEventListener("mousemove", this._handleMouseMove);
      this._currentChartPosition = [];
      this._categoryColor = {};
    }
    setTarget(element) {
      element.appendChild(this._canvas);
    }
    setData(data) {
      this._data = data;
      const colors = getColorList(this.categoryList.length);
      this.categoryList.forEach((category, index) => {
        this._categoryColor[category] = colors[index];
      });
      this._drowStackedBarChart();
    }
    setFilter(category) {
      this._filteredCategory = category;
      this._drowStackedBarChart();
    }
    setTitle(title) {
      this._title = title;
    }
    get categoryList() {
      return this._data.headers.filter((headerKey) => !headerKey.xAxis).map((headerKey) => headerKey.value);
    }
    get chartData() {
      const xAxisIndex = this._data.headers.findIndex((header) => header.xAxis);
      return this._data.data.map((rowData) => {
        const newRowData = [...rowData];
        const key = newRowData[xAxisIndex];
        newRowData.splice(xAxisIndex, 1);
        return {
          key,
          categoryDataList: this.categoryList.map((category, index) => ({
            category,
            value: Number(newRowData[index].split(",").join(""))
          }))
        };
      });
    }
    get lastDataPosX() {
      return this.chartData.length * CHART_BAR_WIDTH;
    }
    _getChartLimitY = () => {
      const baseNum = Math.pow(10, Math.floor(Math.log10(this._yMax)));
      const num = Math.ceil(this._yMax / baseNum);
      return num * baseNum;
    };
    _getYWithUnit = (y) => {
      let tempY = y;
      let texts = [];
      for (const yUnit of UNIT_LIST) {
        const y2 = Math.floor(tempY / yUnit.value);
        if (y2 > 0) {
          texts.push(y2 + yUnit.unit);
          tempY -= y2 * yUnit.value;
        }
      }
      return texts;
    };
    get _yMax() {
      if (this._filteredCategory === void 0) {
        return Math.max(
          ...this.chartData.map((rowData) => {
            const max = rowData.categoryDataList.reduce((prev, curr) => {
              return prev + curr.value;
            }, 0);
            return max;
          })
        );
      }
      const filteredData = this.chartData.map(({ key, categoryDataList }) => {
        return {
          key,
          categoryDataList: categoryDataList.filter(
            ({ category }) => category === this._filteredCategory
          )
        };
      });
      return Math.max(
        ...filteredData.map((rowData) => {
          const max = rowData.categoryDataList.reduce((prev, curr) => {
            return prev + curr.value;
          }, 0);
          return max;
        })
      );
    }
    _xToCanvasX(x) {
      return this._scaleX * (x + this._offsetX);
    }
    _yToCanvasY(y) {
      return FRAME_HEIGHT - y / this._getChartLimitY() * FRAME_HEIGHT + MARGIN_TOP;
    }
    _canvasXToX(canvasX) {
      return canvasX / this._scaleX - this._offsetX;
    }
    _canvasYToY(canvasY) {
      return (FRAME_HEIGHT - canvasY + MARGIN_TOP) / FRAME_HEIGHT * this._getChartLimitY();
    }
    _filterChartDataByCategory() {
      if (this._filteredCategory === void 0) {
        return this.chartData;
      }
      return this.chartData.map(({ key, categoryDataList }) => {
        return {
          key,
          categoryDataList: categoryDataList.filter(
            ({ category }) => category === this._filteredCategory
          )
        };
      });
    }
    _handleMouseMove(e) {
      if (this._isMouseDown) {
        const prevOffsetX = this._offsetX;
        const diffX = e.offsetX - this._mousePosX;
        this._offsetX = diffX + prevOffsetX;
        if (diffX < 0 && this._xToCanvasX(this.lastDataPosX) < MARGIN_LEFT + FRAME_WIDTH - 20) {
          this._offsetX = prevOffsetX;
        }
        if (diffX > 0 && this._xToCanvasX(0) > MARGIN_LEFT + 20) {
          this._offsetX = prevOffsetX;
        }
        this._drowStackedBarChart();
      }
      this._mousePosX = e.offsetX;
      const x = this._canvasXToX(this._mousePosX);
      const hoveredBarData = this._currentChartPosition.find((item) => {
        return x >= item.x.start && x <= item.x.end;
      });
      const y = this._canvasYToY(e.offsetY);
      const hoveredYData = hoveredBarData?.y?.find((item) => {
        return y >= item.start && y <= item.end;
      });
      if (hoveredYData && hoveredBarData && this._filteredCategory === void 0) {
        this._drowStackedBarChart();
        const tooltipText = [
          `${hoveredBarData.x.key}`,
          `${hoveredYData.key}`,
          `${this._getYWithUnit(hoveredYData.end - hoveredYData.start).join("")}`
        ];
        this._drawTooltip(
          this._xToCanvasX(hoveredBarData.x.end),
          this._yToCanvasY((hoveredYData.end + hoveredYData.start) / 2),
          tooltipText
        );
      } else {
        this._drowStackedBarChart();
      }
    }
    _handleWheel(e) {
      const prevScale = this._scaleX;
      const prevOffsetX = this._offsetX;
      let newScaleX = this._scaleX;
      if (e.deltaY > 0) {
        newScaleX -= 0.1;
      } else {
        newScaleX += 0.1;
      }
      const newOffsetX = (1 / newScaleX - 1 / this._scaleX) * this._mousePosX + this._offsetX;
      this._offsetX = newOffsetX;
      this._scaleX = newScaleX;
      if (e.deltaY > 0 && (this._xToCanvasX(this.lastDataPosX) < MARGIN_LEFT + FRAME_WIDTH - 20 && this._xToCanvasX(0) > MARGIN_LEFT + 20)) {
        this._scaleX = prevScale;
        this._offsetX = prevOffsetX;
      }
      this._drowStackedBarChart();
    }
    _handleMouseDown(e) {
      this._isMouseDown = true;
    }
    _handleMouseUp(e) {
      this._isMouseDown = false;
    }
    _drowStackedBarChart() {
      const chartData = this._filterChartDataByCategory();
      const ctx = this._canvas.getContext("2d");
      this._currentChartPosition = [];
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.beginPath();
      ctx.rect(MARGIN_LEFT, MARGIN_TOP, FRAME_WIDTH, FRAME_HEIGHT);
      ctx.stroke();
      const yLimit = this._getChartLimitY();
      for (let i = 1; i <= Y_GRID_COUNT; i++) {
        const canvasX = MARGIN_LEFT;
        const y = i * yLimit / Y_GRID_COUNT;
        const canvasY = this._yToCanvasY(y);
        ctx.beginPath();
        ctx.moveTo(canvasX, canvasY);
        ctx.lineTo(canvasX + FRAME_WIDTH, canvasY);
        ctx.stroke();
      }
      for (let i = 0; i < chartData.length; i++) {
        const x = CHART_BAR_WIDTH * i;
        const canvasX = this._xToCanvasX(x);
        const nextX = CHART_BAR_WIDTH * (i + 1);
        const barWidth = (this._xToCanvasX(nextX) - canvasX) / 2;
        let y = 0;
        const yList = [];
        for (const { category, value } of chartData[i].categoryDataList) {
          ctx.beginPath();
          const canvasY = this._yToCanvasY(y);
          const categoryHeight = this._yToCanvasY(y + value) - canvasY;
          ctx.rect(canvasX, canvasY, barWidth, categoryHeight);
          const color = this._categoryColor[category];
          ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
          ctx.fill();
          yList.push({
            key: category,
            start: y,
            end: y + value
          });
          y += value;
        }
        this._currentChartPosition.push({
          x: {
            key: chartData[i].key,
            start: x,
            end: this._canvasXToX(canvasX + barWidth)
          },
          y: yList
        });
        ctx.font = "12px Arial";
        ctx.fillStyle = "#000";
        ctx.textAlign = "center";
        const graphScalePos = {
          x: canvasX + barWidth / 2,
          y: MARGIN_TOP + FRAME_HEIGHT + 15
        };
        ctx.fillText(`${chartData[i].key}`, graphScalePos.x, graphScalePos.y);
      }
      ctx.beginPath();
      ctx.rect(
        MARGIN_LEFT + FRAME_WIDTH,
        MARGIN_TOP,
        MARGIN_RIGHT,
        FRAME_HEIGHT + MARGIN_BOTTOM
      );
      ctx.rect(0, 0, MARGIN_LEFT, CANVAS_HEIGHT);
      ctx.fillStyle = "#fff";
      ctx.fill();
      for (let i = 1; i <= Y_GRID_COUNT; i++) {
        ctx.font = "12px Arial";
        ctx.fillStyle = "#000";
        ctx.textAlign = "right";
        const y = i * yLimit / Y_GRID_COUNT;
        const yGraphScaleText = this._getYWithUnit(y)[0];
        const canvasX = MARGIN_LEFT;
        const canvasY = this._yToCanvasY(y);
        ctx.fillText(yGraphScaleText, canvasX - 15, canvasY);
      }
      ctx.font = "16px Arial";
      ctx.fillStyle = "#000";
      ctx.textAlign = "center";
      ctx.fillText(this._title, CANVAS_WIDTH / 2, MARGIN_TOP - 20);
      ctx.font = "12px Arial";
      ctx.fillStyle = "#000";
      ctx.textAlign = "center";
      const text = this._data.headers.find((header) => header.xAxis)?.value;
      ctx.fillText(
        text ?? "",
        MARGIN_LEFT + FRAME_WIDTH + 10,
        MARGIN_TOP + FRAME_HEIGHT + 15
      );
    }
    _drawTooltip = (canvasX, canvasY, textList) => {
      const ctx = this._canvas.getContext("2d");
      ctx.beginPath();
      ctx.moveTo(canvasX, canvasY);
      ctx.lineTo(canvasX + 10, canvasY - 5);
      ctx.lineTo(canvasX + 10, canvasY + 5);
      ctx.closePath();
      ctx.fillStyle = "rgba(0, 0, 0, 1)";
      ctx.fill();
      ctx.beginPath();
      const textWidth = Math.max(...textList.map((text) => {
        const span = document.createElement("div");
        span.style.fontSize = "12px";
        span.style.width = "fit-content";
        span.style.padding = "0.5rem";
        span.textContent = text;
        document.body.appendChild(span);
        const width = span.offsetWidth;
        document.body.removeChild(span);
        return width;
      }));
      const size = {
        width: textWidth,
        height: 75
      };
      const topLeft = {
        x: canvasX + 10,
        y: canvasY - size.height / 2
      };
      const radius = 7;
      ctx.moveTo(topLeft.x + radius, topLeft.y);
      ctx.lineTo(topLeft.x + size.width - radius, topLeft.y);
      ctx.quadraticCurveTo(
        topLeft.x + size.width,
        topLeft.y,
        topLeft.x + size.width,
        topLeft.y + radius
      );
      ctx.lineTo(topLeft.x + size.width, topLeft.y + size.height - radius);
      ctx.quadraticCurveTo(
        topLeft.x + size.width,
        topLeft.y + size.height,
        topLeft.x + size.width - radius,
        topLeft.y + size.height
      );
      ctx.lineTo(topLeft.x + radius, topLeft.y + size.height);
      ctx.quadraticCurveTo(
        topLeft.x,
        topLeft.y + size.height,
        topLeft.x,
        topLeft.y + size.height - radius
      );
      ctx.lineTo(topLeft.x, topLeft.y + radius);
      ctx.quadraticCurveTo(topLeft.x, topLeft.y, topLeft.x + radius, topLeft.y);
      ctx.fillStyle = "rgba(0, 0, 0, 1)";
      ctx.fill();
      let textCanvasY = topLeft.y + 25;
      for (const text of textList) {
        ctx.fillStyle = "#fff";
        ctx.font = "12px Arial";
        ctx.textAlign = "left";
        ctx.fillText(text, canvasX + 17, textCanvasY);
        textCanvasY += 17;
      }
    };
  };

  // src/index.ts
  var chart = new StackedBarChart();
  var target = document.getElementById("barChart");
  if (target) {
    chart.setTarget(target);
  }
  var handleFileLoad = async () => {
    if (typeof reader.result === "string") {
      const records = await parse(reader.result);
      const rawData = [];
      for (const record of records) {
        rawData.push(record);
      }
      const headers = rawData[0].map((value, index) => {
        if (index === 0) {
          return {
            value,
            xAxis: true
          };
        }
        return {
          value
        };
      });
      const data = rawData.slice(1);
      chart.setData({
        headers,
        data
      });
      const select2 = document.getElementById("categorySelector");
      chart.categoryList.reverse().forEach((category) => {
        const option = document.createElement("option");
        option.setAttribute("value", category);
        option.innerHTML = category;
        select2?.appendChild(option);
      });
    }
  };
  var reader = new FileReader();
  reader.addEventListener("load", handleFileLoad);
  var handleFileInputChange = () => {
    const element = document.getElementById("fileInput");
    const files = element?.files;
    if (files && files?.length > 0) {
      const file = files[0];
      chart.setTitle(file.name.split(".")[0]);
      reader.readAsText(file);
    }
  };
  var input = document.getElementById("fileInput");
  input?.addEventListener("change", handleFileInputChange);
  var handleChangeSelect = (e) => {
    const target2 = e.target;
    if (target2.value === "all") {
      chart.setFilter(void 0);
      return;
    }
    chart.setFilter(target2.value);
  };
  var select = document.getElementById("categorySelector");
  select?.addEventListener("change", handleChangeSelect);
})();
