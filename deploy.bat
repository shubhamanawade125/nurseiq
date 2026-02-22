@echo off
echo Deploying NurseIQ to Azure App Service...

REM Login to Azure (if not already logged in)
az login

REM Create resource group
az group create --name NurseIQ-RG --location eastus

REM Create App Service plan (Free F1 tier)
az appservice plan create --name nurseiq-plan --resource-group NurseIQ-RG --sku F1 --is-linux

REM Create web app
az webapp create --name nurseiq-app-shubham --resource-group NurseIQ-RG --plan nurseiq-plan --runtime "NODE|18-lts"

REM Zip the application (excluding node_modules and other unnecessary files)
powershell -Command "Compress-Archive -Path . -DestinationPath app.zip -Force"

REM Deploy to Azure App Service
az webapp deployment source config-zip --resource-group NurseIQ-RG --name nurseiq-app-shubham --src app.zip

echo Deployment complete! Your app should be available at: https://nurseiq-app-shubham.azurewebsites.net