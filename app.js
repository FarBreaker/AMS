const { App } = require('@slack/bolt')
require('dotenv').config()
const mongoose = require('mongoose')

connect().catch(err => console.log(err))

async function connect() {
    await mongoose.connect('mongodb://localhost:27017/test')
    console.log('Connected to mongo')
}

const userSchema = new mongoose.Schema({
    name: String,
    task: String
})
const releaseSchema = new mongoose.Schema({
    task: String,
    market: String,
    status: String,
})



const User = mongoose.model("user", userSchema)
const Release = mongoose.model("release", releaseSchema)
//Initialize app with the bot token
const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: process.env.SLACK_APP_TOKEN
})


app.message("status", async ({ say }) => {
    let status = await User.find()
    let messageToSend = ""
    if (status.length > 0) { status.forEach(element => messageToSend += `<@${element.name}> is doing ${element.task}\n`) }
    else {
        messageToSend = "Sorry I don't have any status to tell you"
    }
    await say(messageToSend)

})
app.message("clear", async ({ say }) => {
    await say('All the status have been cleared')

})
app.command('/update', async ({ ack, body, client, logger }) => {
    // Acknowledge the command request
    await ack();
    try {
        // Call views.open with the built-in client
        const result = await client.views.open({
            // Pass a valid trigger_id within 3 seconds of receiving it
            trigger_id: body.trigger_id,
            // View payload
            view: {
                type: 'modal',
                // View identifier
                callback_id: 'view_1',
                title: {
                    type: 'plain_text',
                    text: 'AMS - Update your status'
                },
                blocks: [
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: 'Please be kind and update your task'
                        },
                    },
                    {
                        type: 'input',
                        block_id: 'input_c',
                        label: {
                            type: 'plain_text',
                            text: 'What are your hopes and dreams? Cause you have to drop them'
                        },
                        element: {
                            type: 'plain_text_input',
                            action_id: 'dreamy_input',
                        }
                    }
                ],
                submit: {
                    type: 'plain_text',
                    text: 'Submit'
                }
            }
        });
        logger.info(result)
    }
    catch (error) {
        logger.error(error);
    }

})
app.view('view_1', async ({ ack, body, view, client, logger }) => {
    // Acknowledge the view_submission request
    await ack()
    const val = view['state']['values']['input_c']['dreamy_input']['value']
    const user = body['user']['id']

    let msg = `Hi <@${user}>, I understood your assignment is ${val}`
    console.log("this is the view", val)
    try {
        const data = new User({ name: user, task: val })
        await data.save()
        await client.chat.postMessage({
            channel: user,
            text: msg
        })
    }
    catch (error) {
        logger.error(error)
    }
})
app.start(process.env.PORT || 3000);
console.log(' Bolt running')