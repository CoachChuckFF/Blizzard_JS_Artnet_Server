const MAX_BUFFER = 530
const ARTNET_PORT = 6454
const HEADER = "Art-Net\0"
const PROT_VER = 14
const TTM_SETTINGS = 0x0E //TTM -> talk to me

const INDEX_OP_CODE = 8
const INDEX_PROT_VER = 10
const INDEX_TTM = 12 //TTM -> talk to me
const INDEX_PRIORITY = 13

const DP_LOW = 0x10
const DP_MED = 0x40
const DP_HIGH = 0x80
const DP_CRIT = 0xE0
const DP_VOLATILE = 0xF0

const OP_CODE_POLL = 0x2000
const OP_CODE_POLL_REPLY = 0x2100

var node_list = new Array()
var node = {ip: '0.0.0.0', name: 'example'};
node_list.push(node)

const dgram = require('dgram');
const server = dgram.createSocket('udp4');

server.on('error', (err) => {
  console.log(`server error:\n${err.stack}`);
  server.close();
});

server.on('message', (msg, rinfo) => {
  console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
  parsePacket(msg)
});

server.on('listening', () => {
  const address = server.address();
  console.log(`server listening ${address.address}:${address.port}`);
});

server.bind(ARTNET_PORT)

// server listening 0.0.0.0:41234

parsePacket = function (msg) {

  for(var i = 0; i < 8; i++){
    if(HEADER.charCodeAt(i) !== msg[i]){
      console.log("Bad Artnet Packet")
      return false
    }
  }

  var op_code = msg.readUInt16LE(INDEX_OP_CODE)

  switch(op_code){
    case OP_CODE_POLL:
      return op_code
    break
    case OP_CODE_POLL_REPLY:
      parsePollReplyPacket(msg)
    break
    default:
      console.log("Error: op code = " + op_code)
  }

}

function parsePollReplyPacket(msg){
  var ip = Buffer.alloc(4)
  var name = Buffer.alloc(18)

  for (var entry of node_list.entries()){
    if(entry.ip == ip.toString())
      return;
  }

  node_list.push({ip:ip.toString(), name:name.toString()})
}

exports.getNodeList = function (){
  return node_list
}

exports.sendPoll = function (){
  var msg = Buffer.alloc(14)
  for(var i = 0; i < HEADER.length; i++){
    msg[i] = HEADER.charCodeAt(i)
  }

  msg.writeUInt16LE(OP_CODE_POLL, INDEX_OP_CODE)
  msg.writeUInt16BE(PROT_VER, INDEX_PROT_VER)
  msg.writeUInt8(TTM_SETTINGS, INDEX_TTM)
  msg.writeUInt8(DP_LOW, INDEX_PRIORITY)

  server.setBroadcast(true)

  console.log(this.name)

  server.send(msg, ARTNET_PORT, "255.255.255.255")
}
