echo "kill all the forever running scripts"
forever stopall

echo "jump to the app folder"
cd /home/ubuntu/criteria

echo "update from git"
git pull

echo "install app dependencies"
sudo rm -rf node_modules package-lock.json
npm install

echo "build the app, currently nothing here"

echo "run the app with forever"
NODE_ENV=staging forever start server/server.js
