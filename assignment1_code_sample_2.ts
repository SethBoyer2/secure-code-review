import * as readline from 'readline';
import * as mysql from 'mysql';
import { exec } from 'child_process';
import * as http from 'http';
// Remove credentials from the repo by using environment variables with node
// (From a Medium article & node documentation)
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

function getUserInput(): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question('Enter your name: ', (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}
// Easiest solution I could find on stackOverflow was to implement regex that
// Replaces special characters that could be used in commands 
function sendEmail(to: string, subject: string, body: string) {
    exec(
        `echo "${body.replace(/[^a-zA-Z0-9 .,!?]/g, '')}" | mail -s "${subject}" ${to}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error sending email: ${error}`);
            }
        });
    }

// Switch from HTTP to HTTPS to ensure data is encrypted
function getData(): Promise<string> {
    return new Promise((resolve, reject) => {
        https.get('https://insecure-api.com/get-data', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}
// Can change the query to take parameters and separate the actual SQL logic from the user data
// And keep user input solely as a value instead of possibly executable SQL code
// Uses placeholders and passes data as a value
function saveToDb(data: string) {
    const connection = mysql.createConnection(dbConfig);
    const query = `INSERT INTO mytable (column1, column2) VALUES (?, ?)`;

    connection.connect();
    connection.query(query, [data, 'another value'], (error, results) => {
        if (error) {
            console.error('Error executing query:', error);
        } else {
            console.log('Data saved');
        }
        connection.end();
    });
}
// userInput goes straight into sendEmail(), which used to be an issue but because of 
// The added regex in sendEmail it is no longer an issue.
(async () => {
    const userInput = await getUserInput();
    const data = await getData();
    saveToDb(data);
    sendEmail('admin@example.com', 'User Input', userInput);
})();
