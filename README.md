# droplet-mgmt
An HTML console to report status of all Digital Ocean droplets and allow single click actions. The code is copyright Tim Stephenson and licensed under the [MIT license](http://tstephen.github.io/droplet-mgmt/LICENSE).

## Running from Github.io

1. Launch the app from [http://tstephen.github.io/droplet-mgmt/](http://tstephen.github.io/droplet-mgmt/). 

2. On first load you will see a screen like this. If you have not already, follow the link to create an API key on your digital ocean account. Paste your key in the field provided. This is saved in your browser's localStorage, so unless someone has access to your machine it should be fairly secure. 

  <img height="350" src="http://tstephen.github.io/droplet-mgmt/images/provide-key.png">

3. Once a key is provided your droplet list and their state will be fetched.
  <img height="350" src="http://tstephen.github.io/droplet-mgmt/images/preview.png">

4. To the right of the table available actions for each droplet are displayed. At this time active droplets may be shutdown (gracefully) or inactive ones may be started or a snapshot created. Since these activities can take a minute or so hit the refresh button to get the latest status periodically.

5.  If you do not wish to leave your key in your browser between sessions simply click the 'Log Out' icon in the top right.

## Implementation 

The app is a pure HTML 5 single page app using [jQuery](http://jquery.com/) and [Bootstrap 3](http://getbootstrap.com/) for presentation and [Ractive.js](http://www.ractivejs.org/) for templating and data binding.
