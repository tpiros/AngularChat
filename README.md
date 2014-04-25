# AngularChat - chat app using node.js, socket.io and AngularJS

## Libraries used
### Backend
<ul>
  <li>node.js</li>
  <li>socket.io</li>
  <li>Express</li>
  <li>node-uuid</li>
  <li>underscore</li>
  <li>ejs</li>
  <li>shrinkwrap</li>
</ul>

### Frontend
<ul>
  <li>AngularJS</li>
  <li>Angular-Bootsrap (angular-ui)</li>
  <li>Bootstrap (Yeti theme)</li>
  <li>Font Awesome</li>
</ul>

# Functionality
The functionality list will continually be extended.

<ul>
  <li>People can join the chat server after picking a username (usernames have to be unique per user, alternative usernames are generated as well)</li>
  <li>Once connected people can createa  room (roomnames again have to be unique)</li>
  <li>User agent and geolocation are both automatically detected (geo location has to be approved in the browser first of course)</li>
  <li>People can start chatting with each other once they are ina a room</li>
  <li>Chat history is also displayed, by default the last 10 messages are shown (this setting can be changed)</li>
  <li>'who is typing' feature is also enabled</li>
</ul>

# Setup and configuration

Make sure that you update <strong>app.js</strong> at the backend with your own IP address or hostname:
<pre>app.set('port', process.env.OPENSHIFT_NODEJS_PORT || 3000);
app.set('ipaddr', process.env.OPENSHIFT_NODEJS_IP || '192.168.56.102');
</pre>

Also, tell the frontend where to listen for socket.io - update <strong>public/js/services.js</strong>:

<pre>var socket = io.connect('192.168.56.102:3000');</pre>
(the IP address or host name here should be the same that you've defined in <strong>app.js</strong> at the backend.)

To install the application execute <code>npm install</code>. This will also automatically  install all frontend dependcies using bower (no need to install that separately).

To launch the application please execute <code>node app.js</code>.

For some background on the project, please read this article: http://tamas.io/angularchat/

# Demo

For a working demo, please check: <a href="http://angularchat-tamasnode.rhcloud.com">http://angularchat-tamasnode.rhcloud.com</a>

# Future

I will keep on adding new featues that I have removed from the other application such as:
<ul>
  <li>whisper (private messages)</li>
  <li>Web Speech API</li>
  <li>"and who knows what else..." :)</li>
</ul>
