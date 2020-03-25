# Make sure to throw error when exception caught
set -e

# build with vuepress
npm run docs:build

rm -rf tmp/
mkdir tmp
mv docs/* tmp/
mv .gitignore tmp/
mv .travis.yml tmp/
mv deploy.sh tmp/
mv package.json tmp/
mv yarn.lock tmp/

cp -a tmp/docs/.vuepress/dist/. ./

rm -rf node_modules/
rm -rf tmp/

#cd docs/.vuepress/dist

#git init
#git add -A
#git commit -m 'deploy'

#git push -f git@github.com:turbov10/turbov10.github.io.git master

# If publish to some repo of "https://<USERNAME>.github.io/<REPO>"
# git push -f git@github.com:<USERNAME>/<REPO>.git master:gh-pages

cd -
