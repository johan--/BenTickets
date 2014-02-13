BenTickets
==========

<strong>Framework for creating your own Ticketing site with Forums via the $20/year Zendesk account via API</strong>

node with Jade and Express using node-zendesk for almost all the zendesk api calls except attachments (blakmatrix code doesn't work)
SEE: https://github.com/blakmatrix/node-zendesk

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

User does not need to be created in in Zendesk only the Organization entry is required. 
The ticket will be associated in application as the Details value under the Information section for your Zendesk Organization. 
In the Identities section for you organization add the email addresses and or Twitter accounts for those who should recieve email notifications


UPDATE : benbria_zd.js for username, token, remoteUri
<pre>
    var client = zendesk.createClient({
        username: 'PUT YOUR USERNAME/EMAIL',
        token: 'PUT YOUR TOKEN HERE',
        remoteUri: 'https://COMPANY.zendesk.com/api/v2',
    });
</pre>

UPDATE : app.js look for all instances of ADD TOKEN HERE and update with your token


Update email triggers for customer notification links (Email/Twitter) to point to your site

TODO: add session check for link to ticket and force user to login if not found

