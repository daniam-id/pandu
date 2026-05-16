# Pandu.ai
## Agentic AI Solution for Addressing Urban Logistics Operational Drag

Mini Hackathon Antigravity 2026
Google Developer Group (GDG) Surabaya

Smart Urban Mobility & Logistics (Smart City)

**Team Name:**  
**Members:**
- Adam Dani Apta Mahendra
- Nadif Fijri Fajar Arifin

April 2026

---

# EXECUTIVE SUMMARY

Pandu.ai is an Agentic AI-based solution specifically designed to address the phenomenon of operational drag within the urban logistics ecosystem, particularly in the Surabaya region. Unpredictable traffic conditions in large cities often hinder courier productivity and cause unnecessary operational cost increases for service providers. This solution acts as an intelligent assistant capable of making decisions autonomously to determine the most optimal distribution route for the delivery fleet. With this smart agent approach, administrative and technical barriers in route management can be significantly reduced to ensure smooth supply chains in densely populated areas.

On the technical side, this project leverages the advanced capabilities of Google AI Studio integrated with the Gemini 3.1 Flash-Lite Preview model to ensure maximum system responsiveness. Utilizing this model enables instant multimodal data processing, including the ability to analyze photos of road obstacles to update route instructions for field couriers. The use of a serverless architecture through Cloud Run and Firebase services ensures that this solution remains cost-effective and highly replicable across various business scales. This combination of technologies creates a platform that is not only intelligent in reasoning but also robust and efficient in executing complex logistics tasks.

### Key Differentiators:
- **Full Autonomy:** Reduces dispatcher workload with automated re-routing.
- **Cost Efficiency:** Infrastructure optimization using Google AI Studio and Google Cloud services.
- **Multimodal Adaptation:** Visual obstacle detection (flooding/accidents) through real-time image analysis.
- **High Scalability:** Ready to integrate with existing fleet management systems using cloud infrastructure.

---

# CHAPTER I
## BACKGROUND AND PROBLEM STATEMENT

### 1.1 Current Conditions
Surabaya, as the second largest metropolitan city in Indonesia, has very high mobility complexity, especially during rush hours on main economic corridors. The intensity of last-mile logistics movement is often hindered by dynamic and unpredictable traffic conditions, ranging from sudden road repairs to puddles during the rainy season. These conditions create significant delivery time uncertainty, which ultimately negatively impacts customer satisfaction and overall supply chain efficiency in dense urban areas.

On the other hand, the majority of logistics couriers still operate semi-manually with full dependence on conventional navigation applications. This phenomenon forces couriers to frequently stop on the roadside just to re-check routes or manually look for alternative roads when facing obstacles. These repeated manual interactions trigger operational drag, where productive time is wasted on administrative navigation tasks. Additionally, the habit of checking phones while driving increases safety risks for couriers operating in Surabaya's aggressive traffic flow.

### 1.2 Problem Statement
The emergence of operational drag in logistics processes in Surabaya is caused by several interconnected main issues:

- **Decision-Making Latency:** Couriers waste valuable time stopping and thinking about alternative routes manually when the main route experiences congestion or road closures.
- **Multimodal Data Gap:** Visual field information, such as road closures due to flooding or accidents, cannot be automatically processed by standard navigation systems to provide concrete action recommendations.
- **Fleet Utilization Inefficiency:** The system's lack of independent reasoning capability to combine several nearby delivery routes (order batching) results in wasted fuel and labor.

### 1.3 Urgency of the Solution
Implementing Pandu.ai is a crucial step that must be taken immediately to maintain competitiveness in the logistics industry that demands high speed and precision. Transforming from passive navigation systems to autonomous Agentic AI will significantly cut waiting time in route decision-making. With the reasoning capabilities possessed by Gemini 3.1 Flash-Lite Preview, the system can take over the cognitive tasks of couriers in determining the best route instantly. This speed of adaptation is the main key in minimizing operational inefficiencies that have so far been considered acceptable unforeseen costs.

Furthermore, the urgency of this solution is closely related to profit margin optimization for delivery service business actors. By reducing unnecessary travel distance through intelligent multi-order batching, companies can massively save on fuel costs and fleet maintenance costs. This cost-effective and easily integrated solution through Google AI Studio offers scalability that allows even MSME-scale businesses to have world-class logistics management technology. Without innovations like Pandu.ai, operational barriers will continue to grow along with the increasing volume of deliveries in the future.

---

# CHAPTER II
## PROPOSED SOLUTION

### 2.1 System Description
Pandu.ai is an event-driven autonomous agent designed to intelligently orchestrate logistics workflows using the Reason-Act cycle pattern (ReAct pattern). Instead of merely displaying passive routes, this system acts like a proactive virtual fleet manager. The system is supported by four main components that work synchronously, namely the Gemini Agent Core as the center of multi-step reasoning, and the Real-Time Data Layer which integrates courier GPS coordinates, order status, and traffic data instantly.

As an operational support, this system is also equipped with an intelligent Routing Engine capable of calculating optimal routes based on courier capacity and active congestion. All movements and agent decision logs are then visualized through the Dispatcher Dashboard, an interactive web interface based on the Surabaya map. Through the integration of these components powered by Google AI Studio and the Gemini 3.1 Flash-Lite Preview model, Pandu.ai ensures that every distribution decision is made with high precision without requiring constant manual intervention.

### 2.2 How the Agent Works

**Figure 2.1. How the Agent Works**

The AI agent in Pandu.ai operates using an autonomous Sense-Think-Act cycle powered by Gemini 3.1 Flash-Lite Preview through Google AI Studio:

- **Sense:** The agent continuously monitors data streams from Google Maps Platform regarding traffic density and courier GPS positions stored in Firestore.
- **Think:** When anomalies are detected (such as sudden congestion or inefficient routes), the agent performs reasoning to compare various alternative route scenarios. The agent simultaneously considers travel time, distance, and package priority variables.
- **Act:** The agent automatically updates the best route in the courier application and provides specific instructions through the system interface. This entire decision-making process is carried out autonomously in a matter of seconds to ensure operational drag remains at a minimum.

### 2.3 Multimodal Capabilities (Extension)
As an additional intelligence layer, Pandu.ai implements visual data processing features through the multimodal capabilities possessed by the Gemini model. This system provides a special interface (such as a chat feature) that allows field couriers to send visual reports in the form of direct road condition photos. This feature is designed to address blind spots on conventional digital maps, where hyper-local incidents such as roads suddenly closed by residents, fallen trees, or flood puddles are often not detected by standard traffic radar.

When a photo is received, the AI agent will instantly analyze the visual elements in the image to infer the severity level of the road obstacle. This visual information is then combined with map data (situational awareness) as a high-weighted additional signal. If the agent assesses that the road is unfit or unsafe to pass, the system will trigger the reasoning cycle to immediately perform rerouting. Thus, Pandu.ai creates an adaptive, responsive navigation ecosystem with human-like contextual understanding.

---

# CHAPTER III
## TECHNICAL ARCHITECTURE

### 3.1 Technology Stack
This system is built with a modern architecture that separates the interface layer, data processing, and intelligence center. Technology selection is based on principles of development velocity, scalability, and cost efficiency.

**Table 3.1. Technology Stack**

| Layer | Component | Technology |
|-------|-----------|------------|
| AI & Reasoning | Gemini Agent + Function Calling | Google AI Studio, Gemini 3.1 Flash-Lite |
| Backend / Compute | API & Event Handler | Google Cloud Run |
| Database & Sync | Order & Courier Data (Real-time) | Google Firebase (Firestore) |
| Routing | Route & Traffic Calculation | Google Maps Platform (Routes API) |
| Frontend | Dispatcher Dashboard | React.js, Tailwind CSS |
| Hosting | UI Deployment & Static Assets | Firebase Hosting |

### 3.2 Data Flow

**Figure 3.1. Data Flow**

The Pandu.ai data architecture follows an integrated flow pattern to ensure that decisions made are always based on the latest data:

- **Ingestion:** GPS coordinate data from the courier application and traffic conditions from the Google Maps API enter the Firestore database continuously.
- **Processing:** Cloud Run acts as middleware that monitors data changes. If obstacles or new orders are detected, Cloud Run will send that data context to the Gemini Agent.
- **Reasoning:** The Gemini Agent through Google AI Studio analyzes the data, considers the best scenarios, and decides the necessary actions (for example: changing routes or combining packages).
- **Delivery:** The agent's decisions are written back to Firestore, which automatically triggers updates on the manager dashboard and courier navigation application in less than one second.

---

# CHAPTER IV
## VALUE AND IMPACT

### 4.1 Reduction of Operational Drag
The main value of Pandu.ai lies in its ability to eliminate operational drag in a measurable way within daily logistics cycles. Conventionally, when traffic incidents or schedule changes occur, the communication process between couriers and dispatchers to determine new routes takes an average of 5 to 10 minutes per incident. Through the implementation of proactive Agentic AI, this cognitive and administrative burden is completely taken over by the system.

Pandu.ai can detect anomalies, perform logical reasoning, and reformulate alternative routes in less than 30 seconds. This drastic response time reduction has a direct impact on increasing courier productivity on the road. In addition, with the multi-order batching feature automatically managed by the agent, companies can reduce excessive travel distance, resulting in fuel cost savings and reduced carbon emissions in the Surabaya urban environment.

### 4.2 Relevance of the Google Cloud Ecosystem
This project is designed in alignment with Antigravity's main vision, namely creating solutions that are lightweight, fast, and innovative using the Google Cloud ecosystem. The technology stack selection in Pandu.ai represents the implementation of best practices for developing modern yet cost-effective architecture:

- **Google AI Studio & Gemini 3.1 Flash-Lite:** Acts as the main brain of the agent offering low-latency reasoning speed and high-level multimodal capabilities without requiring heavy machine learning infrastructure costs.
- **Google Cloud Run:** Brings a serverless computing environment that ensures backend handlers can run elastically. This system automatically scales when traffic spikes occur without idle server allocation.
- **Firebase (Firestore):** Provides a real-time state management and data synchronization layer that is crucial to keep the AI agent and courier application connected within the same operational situational understanding.

Overall, the utilization of this ecosystem proves that advanced automation (Agentic AI) can be implemented efficiently, affordably, and is highly ready to be adapted by medium to large scale logistics industries.

---

# CHAPTER V
## IMPLEMENTATION AND DEMONSTRATION PLAN

### 5.1 Development Plan (Timeline)
To ensure the system is ready to be demonstrated in the Antigravity offline session and has clear scalability prospects going forward, the Pandu.ai development process is divided into three strategic phases:

**Table 5.1. Development Plan**

| Phase | Timeframe | Development Focus | Target Achievements (Milestones) |
|-------|-----------|-------------------|----------------------------------|
| Phase 1: Core Agent & Infrastructure | 26 – 29 April 2026 | Backend & AI Integration | • Setup Google AI Studio & Gemini 3.1 Flash-Lite.<br>• Configure real-time database using Firestore.<br>• Build routing logic and cognitive functions (function calling). |
| Phase 2: MVP & Demo Preparation | 30 April – 2 May 2026 | Frontend & Simulation | • Complete the Dispatcher Dashboard interface (React.js).<br>• Synchronize end-to-end data flow (Firestore to UI).<br>• Test 4 direct simulation scenarios for the judges' presentation session. |
| Phase 3: Post-Hackathon Optimization | 3 – 10 May 2026 | System Refinement | • Full deployment of services via Cloud Run & Firebase Hosting.<br>• Evaluate latency and calibrate AI agent reasoning accuracy.<br>• Publish architecture documentation and code neatly on GitHub. |

### 5.2 Demonstration Plan
To prove the real effectiveness of Pandu.ai, our team has designed an end-to-end simulation that will be demonstrated through the Surabaya interactive map-based Dispatcher Dashboard interface. This demonstration will display four operational scenarios representing daily logistics challenges:

**Scenario 1: Initialization & Normal Distribution**
- **Simulation:** Five marker points representing the courier fleet move in real-time on the Surabaya map.
- **Focus:** Showing how the AI agent (Gemini) automatically performs initial mapping and distributes route lists to each courier without human intervention.

**Scenario 2: Dynamic Response to Congestion**
- **Simulation:** The system will inject mock-up data of severe congestion occurring suddenly on busy corridors such as Jalan HR Muhammad.
- **Focus:** Proving low latency from the agent. The judges will directly see how the system detects the anomaly and triggers automatic rerouting for couriers heading to the congested zone in less than 30 seconds.

**Scenario 3: Fleet Optimization (Multi-Order Batching)**
- **Simulation:** Three new orders from merchant pickup points close to each other within a radius of less than 1 km.
- **Focus:** Demonstrating the agent's logical reasoning capability that decides not to call a new courier, but instead batches the three orders to the nearest courier to save fleet travel distance.

**Scenario 4: Multimodal Field Intervention**
- **Simulation:** A direct interaction where a "courier" sends a photo of severe flooding or road closure through the application interface.
- **Focus:** Demonstrating the flagship Vision feature of Gemini 3.1 Flash-Lite. The agent will instantly analyze the photo, infer the obstacle level, and update the routing decision on the dashboard screen to avoid the flooded area.

---

# CHAPTER VI
## CONCLUSION

Pandu.ai emerges as a concrete solution to address the operational drag challenges faced by the logistics sector in densely populated areas, particularly in the city of Surabaya. By integrating the power of Agentic AI based on Gemini 3.1 Flash-Lite Preview and the efficiency of the Google Cloud ecosystem, this system transforms logistics processes that were previously reactive and manual into a system that is proactive, autonomous, and intelligent. This innovation proves that advanced AI technology can be implemented lightly and precisely without requiring complex infrastructure.

Through the development of Pandu.ai, we are committed to creating a real impact for the technology community and the Smart City ecosystem in Surabaya. We believe that route optimization through cognitive reasoning and multimodal capabilities is not merely a technical efficiency improvement, but a step forward in creating smoother urban mobility, safer conditions for couriers, and benefits for industry players. Pandu.ai is a representation of the future of smart and efficient logistics in the hands of the young innovator generation.