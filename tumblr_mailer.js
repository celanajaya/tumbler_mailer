//required modules
//file system
var fs = require('fs');
//embedded js
var ejs = require('ejs');
//tumblr api
var tumblr = require('tumblr.js');
//mandrill api
var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill('sJ_WRUfVBIG7WJnhPPV2MQ');

//create a client: gives access to my blog posts 
var client = tumblr.createClient({
  consumer_key: 'nope...',
  consumer_secret: 'not telling',
  token: 'uh-uh',
  token_secret: 'not a chance...'
});

//read contents of friend list/email
//function returns a string
var csvFile = fs.readFileSync('friend_list.csv', 'utf8');
var emailTemplate = fs.readFileSync('email_template.ejs', 'utf8');

//parse my csvFile into an array
var csvParse = function(csv) {
    var arrayOfObjects = [];
    var arrayOfStrings = csv.split('\n');
    var headerArray = arrayOfStrings[0].split(',');
    arrayOfStrings = arrayOfStrings.slice(1,-1);
    
    arrayOfStrings.forEach(function(contact){
        contact = contact.split(',');
        var contactObj = {};
        for (i = 0; i < contact.length; i++) {
            contactObj[headerArray[i]] = contact[i];
        }
        arrayOfObjects.push(contactObj);
    })
    return arrayOfObjects;
};

var friendList = csvParse(csvFile);  

function sendEmail(to_name, to_email, from_name, from_email, subject, message_html){
    var message = {
        "html": message_html,
        "subject": subject,
        "from_email": from_email,
        "from_name": from_name,
        "to": [{
                "email": to_email,
                "name": to_name
            }],
        "important": false,
        "track_opens": true,    
        "auto_html": false,
        "preserve_recipients": true,
        "merge": false,
        "tags": [
            "Fullstack_Tumblrmailer_Workshop"
        ]    
    };

    var async = false;
    var ip_pool = "Main Pool";
    mandrill_client.messages.send({"message": message, "async": async, "ip_pool": ip_pool}, function(result) {
        // console.log(message);
        // console.log(result);   
    }, function(e) {
        // Mandrill returns the error as an object with name and message keys
        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
        // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
    });
}

//asynchronously executed function that retrieves posts from tumblr, adds that info to 
//an html email, and sends it using the mandrill API.
var populateAndSend = client.posts('goingfullstack.tumblr.com', function(err, blog){
    var postArray = blog.posts;
    var latest = [];
    var now = new Date();
    //goes through an array of objects containing lots of post info, appends the title and url of the 
    //newest ones to another array.
    postArray.forEach(function(post) {
        var postDate = new Date(post.date);
        if (postDate.getTime() > now.getTime() - 604800000) {
            var linktoPost = post.slug + ": " + post.post_url; 
            latest.push(linktoPost);
        } 
    });
    //renders and sends a unique email to each contact with the blog post info.
    friendList.forEach(function(contact) {
        var customEmail = ejs.render(emailTemplate, 
            {firstName: contact['firstName'],
            latest: latest
        });
        sendEmail(contact["firstName"], contact["emailAddress"], "Pete Steele", "petermsteele@gmail.com", "Summertime update!", customEmail);
        //test email
        //sendEmail("Pete", "petermsteele@gmail.com", "Pete", "petermsteele@gmail.com", "stuff", customEmail)
    });
});