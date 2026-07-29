#!/bin/bash
cd C:/Users/USER/github/gor
git add -A
git commit -m "feat: UI redesign + page transitions + dummy payment"
git push origin master
cd frontend/gor-client
npx vercel --prod --yes
cd C:/Users/USER/github/gor
npx railway up --service gor-booking --detach
npx railway variable set "PAYMENT_MODE=dummy" --service gor-booking --skip-deploys
