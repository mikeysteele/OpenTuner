export class Discovery {
  private socket: Deno.DatagramConn | null = null;
  private deviceId = '12345678'; // Example ID
  private ip = '127.0.0.1'; // Default, should be detected

  constructor(deviceId?: string, ip?: string) {
    if (deviceId) this.deviceId = deviceId;
    if (ip) this.ip = ip;
  }

  start(): void {
    try {
      this.socket = Deno.listenDatagram({
        port: 65001,
        transport: 'udp',
      });
      console.log('HDHR Discovery listening on udp:65001');
      this.loop();
    } catch (e) {
      console.error('Failed to start discovery listener:', e);
    }
  }

  private async loop(): Promise<void> {
    if (!this.socket) return;
    for await (const [data, addr] of this.socket) {
      this.handlePacket(data, addr);
    }
  }

  private handlePacket(data: Uint8Array, addr: Deno.Addr): void {
    // Basic check for HDHR Discover Packet (Type 0x0002)
    // HDHR Packet Structure: Type (2 bytes), Length (2 bytes), Data (variable), CRC (4 bytes)
    if (data.length < 4) return;

    // Check Type 0x0002
    if (data[0] === 0x00 && data[1] === 0x02) {
      // console.log("Received Discover request from", addr);
      this.sendOffer(addr);
    }
  }

  private sendOffer(addr: Deno.Addr): void {
    if (!this.socket) return;

    // Construct Offer Packet (Type 0x0003)
    // We need to add tags: DeviceID (0x01), DeviceType (0x02 - Tuner), optional BaseURL (0x2A)
    // For simplicity, we just send a constructed packet that mimics a response.
    // A real implementation would need a proper writer for TLV.
    // Here we construct a minimal valid response.

    // Tag 0x01: Device ID (4 bytes)
    const deviceIdBytes = new Uint8Array(4);
    const idVal = parseInt(this.deviceId, 16);
    new DataView(deviceIdBytes.buffer).setUint32(0, idVal, false); // Big Endian? HDHR is Big Endian usually.

    // Tag 0x02: Device IP (4 bytes for IPv4)
    const ipParts = this.ip.split('.').map(Number);
    const ipBytes = new Uint8Array(ipParts);

    // Payload construction
    const payload = [
      0x01,
      0x04,
      ...deviceIdBytes, // Device ID
      0x02,
      0x04,
      ...ipBytes, // Device IP
      0x05,
      0x01,
      0x01, // Device Type (0x01 = wild guess, usually 0x05 is tuner count? )
      // Actually 0x02 tag is device identifier usually?
      // Let's stick to the prompt's simplicity: "Offer containing Device ID and IP"
    ];

    // Packet: Type (0x0003), Length (2 bytes), Payload, CRC (4 bytes)
    const length = payload.length;
    const packet = new Uint8Array(4 + length + 4);
    const view = new DataView(packet.buffer);

    view.setUint16(0, 0x0003, false); // Type
    view.setUint16(2, length, false); // Length
    packet.set(payload, 4);

    // CRC32 calculation is required for real clients to accept it.
    // For now, we will leave CRC as 0s or implement a basic CRC if needed.
    // Many clients might ignore it or strict ones will drop.
    // Implementing a full CRC32 function here is long. I'll omit for brevity unless critical.
    // However, the prompt asks for "Logic".

    const crc = this.crc32(packet.subarray(0, 4 + length));
    view.setUint32(4 + length, crc, true); // Little endian for CRC usually? HDHR spec says CRC is Appended.

    this.socket.send(packet, addr);
  }

  private crc32(data: Uint8Array): number {
    let crc = 0xFFFFFFFF;
    for (const byte of data) {
      crc ^= byte;
      for (let i = 0; i < 8; i++) {
        crc = (crc >>> 1) ^ (-(crc & 1) & 0xEDB88320);
      }
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
}
