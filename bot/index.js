const Eris = require("eris");
const config = require("./config");
const runCommand = require("./command");

const bot = Eris(config.bot.token);

bot.on("ready", () => {
   console.log("I'm a speed junkie...");
   bot.editStatus("online", { name: "your server messages", type: 3 });
});

function messageIsFromSelf(msg) {
   return msg.author.id === config.client.id;
}

const messageCauseEffect = {};

const oneSecond = 1000;
const fiveSeconds = oneSecond * 5;

bot.on("messageCreate", async msg => {
   if (messageIsFromSelf(msg)) {
      return;
   }

   const commandOutput = runCommand(msg.content);
   if (commandOutput === null) {
      return;
   }

   const sentMsg = await bot.createMessage(msg.channel.id, commandOutput);
   messageCauseEffect[msg.id] = sentMsg;
   setTimeout(() => {
      delete messageCauseEffect[msg.id];
   }, fiveSeconds);
});

bot.on("messageUpdate", msg => {
   if (messageIsFromSelf(msg)) {
      return;
   }

   if (msg.editedTimestamp === undefined) {
      return;
   }

   const oldMessage = messageCauseEffect[msg.id];
   if (oldMessage === undefined) {
      return;
   }

   const fiveSecondsLater = msg.timestamp + fiveSeconds; // this may be redundant
   if (msg.editedTimestamp > fiveSecondsLater) {
      return;
   }

   const commandOutput = runCommand(msg.content);
   if (commandOutput === null) {
      oldMessage.edit(":disapproval:");
   } else {
      oldMessage.edit(commandOutput);
   }
});

bot.on("messageDelete", msg => {
   const deleteTime = Date.now();

   if (!msg.author || messageIsFromSelf(msg)) {
      return;
   }

   const oldMessage = messageCauseEffect[msg.id];
   if (oldMessage === undefined) {
      return;
   }

   const tenSecondsLater = msg.timestamp + oneSecond * 10;
   if (deleteTime > tenSecondsLater) {
      return;
   }

   oldMessage.delete();
});

bot.connect();