# Crime-Portal
A website for logging and managing crime

With rapid development in recent times, the graph of crime is also on the rise. This phenomenal rise in offences and crimes in cities is a matter of great concern. Besides the registering of any Crime report is also a great responsibility for the Crime Branch of the locality.
So here is a website which can manage all the Complaints from head to user levels.

## Installation Guide
This project requires the following tools:

* [Node.js](https://nodejs.org/en/) - The JavaScript environment for server-side code.
* [NPM](https://www.npmjs.com/) - A Node.js package manager used to install dependencies.

### Getting Started
#### Step 1. Clone the code into a fresh folder.
```
$ git clone https://github.com/Sanjana1201/Crime-Portal.git
$ cd Crime-Portal
```
#### Step 2. Install Dependencies.
Next, we need to install the project dependencies, which are listed in `package.json`.
```
$ npm install
```
#### Step 3: Create an app on Google
Head over to [Google OAuth apps](https://console.cloud.google.com/apis/dashboard) and create a new OAuth app from OAuth Consent screen. Name it what you like and request only for email,profile and openId.
Then create new credentials for OAuth ClientID but you'll need to specify a callback URL, which should be something like:

[![github.png](https://i.postimg.cc/K8sqkcWF/github.png)](https://postimg.cc/jDPQBTKk)

Save the credentials. The default port for our app is `3000`, but you may need to update this if your setup uses a different port or if you're hosting your app somewhere besides your local machine.

#### Step 4: Update environment variables and run the Server.
Create a new file named `.env` in the project folder. Update it with the credentials and also add a secret string of your own without spaces.It should look similar to this:
```
# .env file
SECRET=[INSERT_A_STRING_WITHOUT_SPACES]
CLIENT_ID=[INSERT_CLIENT_ID]
CLIENT_SECRET=[INSERT_CLIENT_SECRET]
```
Replace the Google credentials here. Learn more about the required [Environment Variables here](https://www.npmjs.com/package/dotenv).

Now we're ready to start our server which is as simple as:
```
$ node app.js
```
Open http://localhost:3000 to view it in your browser.

You need to reload if you make changes to the code and start your server again. You will see the build errors and warnings in the console.

## Screenshot
[![github-1.png](https://i.postimg.cc/3J60kdh3/github-1.png)](https://postimg.cc/8jRz3ksY)

## Usage

* User -  They can login manually or using google and log their complain. They can even view the progress of the case they have filed.
* Head Quaters - They can login using
```
UserID: head@Headquarters.com
password: head
```
And view all the complaints filed by users. They can further enter new police station and their incharges.
* Incharge - They can login using the credentials entered by the head and log new police officers.
* Police - They can login using the credentials entered by their incharge and provide the updates on complaints in their area. 
