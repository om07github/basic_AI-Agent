import OpenAI from "openai"
import readlineSync from "readline-sync"
import dotenv from "dotenv"

dotenv.config()

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

function getWeatherDetails(city = ''){
    if(city.toLocaleLowerCase() == "pune") return '10°C';
    if(city.toLocaleLowerCase() == "mumbai") return '20°C';
    if(city.toLocaleLowerCase() == "banglore") return '15°C';
    if(city.toLocaleLowerCase() == "nashik") return '16°C';
    if(city.toLocaleLowerCase() == "nagpur") return '18°C';
}

// const user = 'Hey, what is the weather of pune?'

// client.chat.completions.create({
//     model: 'o1-mini',
//     messages: [{ role: 'user', content: user}],
// }).then(e => {
//     console.log(e.choices[0].message.content);
// })

const tools = {
    "getWeatherDetails": getWeatherDetails
}

const SYSTEM_PROMPT = `
const SYSTEM_PROMPT =

You are an AI Assistant with START, PLAN, ACTION, Obeservation and Output State.
Wait for the user prompt and first PLAN using available tools.
After Planning, Take the action with appropriate tools and wait for Observation based on Action.
Once you get the observations, Return the AI response based on START propmt and observations

Strictly follow the JSON output format as in examples

Available Tools:
-function getWeatherDetails(city: string): string
getWeather Details is a function that accepts city name as string and retuns the weather details

Example:
START
{"type": "user", "user": "What is the sum of weather of Patiala and Mohali?" }
{"type": "plan", "plan": "I will call the getWeatherDetails for Patiala" }
{"type": "action", "function": "getWeatherDetails", "input": "patiala" }
{"type": "observation", "observation": "10°C" }
{"type": "plan", "plan": "I will call getWeatherDetails for Mohali" }
{"type": "action", "function": "getWeatherDetails", "input": "mohali" }
{ "type": "observation", "observation": "14°C" }
{"type": "output", "output": "The sum of weather of Patiala and Mohali is 24°C"}
`
const messages = [{role: 'system', content: SYSTEM_PROMPT}]

while(true) {
    const query = readlineSync.question('>>');
    const q ={
        type: 'user',
        user: 'What is the sum of weather of Pune and Mumbai'
    };
    messages.push({role: 'user', content: JSON.stringify(q)});

    while (true) {
        const chat = await client.chat.completions.create({
            model: 'gpt-4',
            messages: messages,
            response_format: {type: 'json_object'},
        });

        const result = chat.choices[0].message.content;
        messages.push({ role: 'assistant', content: result })

        const call = JSON.parse(result)

        if(call.type == "output") {
            console.log(`${call.output}`);
            break;
        } else if (call.type == "action") {
            const fn = tools[call.function]
            const observation = fn(call.input)
            const obs = { "type": "observation", "observation": observation}
            messages.push({ role: "developer", content: JSON.stringify(obs)})
        }
    }
}