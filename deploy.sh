# Make sure to throw error when exception caught
set -e

# build with vuepress
npm run docs:build

cd docs/.vuepress/dist

#git init
git add -A
git commit -m 'deploy'

git push -f git@github.com:turbov10/turbov10.github.io.git master

# If publish to some repo of "https://<USERNAME>.github.io/<REPO>"
# git push -f git@github.com:<USERNAME>/<REPO>.git master:gh-pages

cd -
