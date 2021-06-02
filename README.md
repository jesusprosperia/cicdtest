# Decision Support Platform

Decision support platform for targeting social policies

### Deployment

* `main` branch for heroku staging server
* `master` production
* `dev` for development

### Running development environment

## Server:

* in the root directory, run `npm install`
* npm start - will start the server without watching file changes
* npm run dev - will start node script using nodemon which will watch file changes and re-start the server

## Client:
* go to the client directory using `cd ./client`
* run `npm install`
* npm run serve - will start development server
* npm run build - will generate production build scripts and styles under `/dist` folder