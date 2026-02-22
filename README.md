# NurseIQ 🏥🤖

## AI-Powered Clinical Workflow Agent System for Nurses

**Microsoft AI Dev Days Hackathon 2026 Submission**

NurseIQ is an intelligent clinical workflow assistant designed to revolutionize nursing documentation and patient care workflows. By leveraging cutting-edge AI technology powered by Azure OpenAI's GPT-4o-mini model, NurseIQ helps nurses focus more on patient care while automating tedious documentation tasks.

![NurseIQ Interface](https://via.placeholder.com/800x400/007bff/ffffff?text=NurseIQ+Medical+Interface)

## ✨ Key Features

### 🤖 AI Documentation Assistance
- **Intelligent Note Processing**: Automatically analyzes and summarizes patient interactions
- **Clinical Documentation**: Generates structured medical notes from natural language input
- **Smart Suggestions**: Provides real-time recommendations for care plans and interventions
- **Voice-to-Text Integration**: Supports voice input for hands-free documentation

### 🏥 Clinical Workflow Optimization
- **Patient Monitoring**: Tracks vital signs and alerts for anomalies
- **Medication Management**: Intelligent reminders and dosage calculations
- **Shift Handover**: Automated report generation for seamless team transitions
- **Compliance Tracking**: Ensures adherence to clinical protocols and standards

### 🔒 Enterprise-Grade Security
- **HIPAA Compliant**: Built with healthcare data privacy in mind
- **Azure Key Vault Integration**: Secure storage of API keys and sensitive data
- **Role-Based Access**: Configurable permissions for different healthcare roles

### 📱 Modern Web Interface
- **Responsive Design**: Works seamlessly on desktops, tablets, and mobile devices
- **Intuitive Chat Interface**: Natural conversation flow for easy interaction
- **Real-time Updates**: Live synchronization across multiple devices

## 🛠 Tech Stack

### Frontend
- **HTML5** - Semantic markup for accessibility
- **CSS3** - Modern styling with medical-themed design
- **Vanilla JavaScript** - Lightweight, fast client-side interactions

### Backend
- **Node.js** - Runtime environment for server-side logic
- **Express.js** - Web framework for API development
- **RESTful APIs** - Clean, scalable API design

### AI & Cloud
- **Azure OpenAI GPT-4o-mini** - Advanced language model for clinical intelligence
- **Azure Key Vault** - Secure credential management
- **Azure App Service** - Scalable web hosting on Linux
- **Azure CLI** - Infrastructure as Code deployment

### Development Tools
- **npm** - Package management
- **Git** - Version control
- **VS Code** - Development environment

## 🚀 How to Run Locally

### Prerequisites
- Node.js (v18 or higher)
- Azure CLI
- Azure subscription with OpenAI access
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/nurseiq.git
   cd nurseiq
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Azure resources**
   ```bash
   # Login to Azure
   az login

   # Create resource group
   az group create --name NurseIQ-RG --location eastus

   # Create App Service plan (Free tier)
   az appservice plan create --name nurseiq-plan --resource-group NurseIQ-RG --sku F1 --is-linux

   # Create web app
   az webapp create --name nurseiq-app-yourname --resource-group NurseIQ-RG --plan nurseiq-plan --runtime "NODE|18-lts"
   ```

4. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   AZURE_KEY_VAULT_URL=https://your-keyvault.vault.azure.net/
   OPENAI_API_KEY=your-openai-key
   AZURE_SUBSCRIPTION_ID=your-subscription-id
   PORT=3000
   ```

5. **Set up Azure Key Vault** (for production security)
   ```bash
   # Create Key Vault
   az keyvault create --name your-keyvault --resource-group NurseIQ-RG --location eastus

   # Store OpenAI API key
   az keyvault secret set --vault-name your-keyvault --name openai-api-key --value "your-actual-key"
   ```

### Running the Application

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Open your browser**
   Navigate to `http://localhost:3000`

3. **Access the application**
   - Use the chat interface to interact with NurseIQ
   - Test AI documentation features
   - Explore clinical workflow tools

### Deployment to Azure

1. **Build deployment package**
   ```bash
   # Create zip excluding node_modules
   Get-ChildItem . -Exclude node_modules | Compress-Archive -DestinationPath app.zip -Force
   ```

2. **Deploy to Azure App Service**
   ```bash
   # Set startup command
   az webapp config set --resource-group NurseIQ-RG --name nurseiq-app-yourname --startup-file "node backend/server.js"

   # Deploy
   az webapp deployment source config-zip --resource-group NurseIQ-RG --name nurseiq-app-yourname --src app.zip
   ```

3. **Access your deployed app**
   Visit `https://nurseiq-app-yourname.azurewebsites.net`

## 🏆 Hackathon Submission Info

### Microsoft AI Dev Days Hackathon 2026
- **Category**: Healthcare & AI
- **Theme**: AI for Social Good
- **Team**: Solo Developer (Shubham Anawade)
- **Submission Date**: February 22, 2026

### Project Goals
- Demonstrate practical AI application in healthcare
- Showcase Azure OpenAI integration
- Highlight secure, scalable cloud architecture
- Address real nursing workflow challenges

### Innovation Highlights
- **First-of-its-kind**: Specialized AI for nursing documentation
- **Azure Integration**: Full Microsoft cloud stack utilization
- **Privacy-First**: Healthcare-compliant data handling
- **User-Centric Design**: Built by understanding real nursing needs

### Judging Criteria Alignment
- ✅ **Technical Excellence**: Advanced AI integration with Azure
- ✅ **Innovation**: Novel approach to clinical workflow automation
- ✅ **Scalability**: Cloud-native architecture ready for enterprise
- ✅ **User Experience**: Intuitive interface designed for healthcare professionals
- ✅ **Business Impact**: Potential to improve patient care and reduce nurse burnout

## 📊 Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   NurseIQ Web   │    │   Express API   │    │   Azure OpenAI  │
│   Interface     │◄──►│   Backend       │◄──►│   GPT-4o-mini   │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Azure App     │    │   Azure Key     │    │   Clinical      │
│   Service       │    │   Vault         │    │   Database      │
│                 │    │                 │    │   (Future)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for details.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Microsoft AI Dev Days Hackathon organizers
- Azure OpenAI team for providing access to GPT-4o-mini
- Healthcare professionals who provided insights into nursing workflows
- Open source community for amazing tools and libraries

---

**Built with ❤️ for nurses, by developers who care about healthcare innovation**

*For questions or collaboration opportunities, reach out to the development team.*
