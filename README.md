BenTickets
==========

<strong>Framework for creating your own Ticketing site with Forums via the $20/year Zendesk account via API</strong>

node with Jade and Express using node-zendesk 
SEE: https://github.com/drobern/node-zendesk

run npm install to add all dependencies

create accounts in http://localhost:3000/user 
entry stored in db.json<br><strong>NO DB REQUIRED</strong></br>
<br>following fields required:</br>
<ul>
    <li>Email Address:</li>
    <li>Passwrod:</li>
    <li>Organizations: Object of n organizations entered as full object i.e {"organization":"11111","organization2":"22222"}</li>
    <li>Forum ID to be visible for end user
</ul>
<strong> Multiple organizations works well for resellers who service multiple customers. </strong>

Create all your Organizations in Zendesk and then each time you add a new User in your App, add a new Person ensuring you use the same email address, noting that this is case sensitive. Associate you Zendesk entry to the Organization created. In the information box provide the Full name and any other information you would like to be displayed when a ticket comment is entered

CREATE: A config.js file in your root folder with the following
<pre>
    var config = {};

    config.username='EMAIL ADDRESS FOR ZENDESK';
    config.token='TOKEN FOR YOU ZENDESK USER'
    config.remoteUri='https://COMPANY.zendesk.com/api/v2';

    module.exports = config;
</pre>
REPLACE: The UPPERCASE words with your values from Zendesk

UPDATE: Email settings in apps.js to point to your email account (default for gmail)
<pre>
    var smtpTransport = nodemailer.createTransport("SMTP",{
        service: "Gmail",
        auth: {
            user: "xxx@google.com",
            pass: "xxxxx"
        }
   });
</pre>

UPDATE: Email welcome message and text for you email, website and company name
<pre>
    var mailOptions = {
      from: "support@gmail.com",
      to: username,
      subject: "Your account had been created",
      text: "Welcome to Benbria Online ticket at http://xxxx.xxxx.com.\nPlease note your \nUsername: "+username+"\nPassword: "+password+"\nThank you\n xxxxx Team" ,
  }
</pre>

UPDATE: 'To:' for the post to registerUser search for - <pre> to: "name@name.com", </pre>

Update email triggers for customer notification links (Email/Twitter) to point to your site



