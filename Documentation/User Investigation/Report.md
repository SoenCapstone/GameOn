# Description  

To understand how potential users would interact with our app and which features they actually care about, we ran a short online survey using Google Forms with hopes of targeting amateur and semi-competitive team-sport players in our extended network.  

We collected **12 responses** as of Nov 10th 2025. The sample is small and convenience-based, but it gives us an early signal about:  

- How valuable people think a sports manager app could be for them  
- Which features feel “must have” vs “nice to have”  
- How messaging, statistics, and update feeds should behave in practice  
- What would make people drop the app immediately  

The survey mixed multiple-choice, 1–5 Likert scales, and a few open-ended questions, so we could combine light quant analysis with concrete design ideas and concerns.  

## a. Designing Experiments

### **Objectives**

When designing this survey, we focused on four aspects:

1. **Which demgroaphic is the participant part of?**  
   - Age range  
   - Level of involvement in team sports  
   - Whether they actively follow sports news  

2. **Is the core concept valuable?**  
   - “On a scale of 1–5, how much would a career-management app help you?”  

3. **Which features should we prioritize?**  
   - Messaging  
   - Casual game finder  
   - Personal & team statistics  
   - Finding teams / leagues to *join*  
   - Finding teams / leagues to *follow*  
   - Automated schedule  
   - Feed of updates  

4. **How should key features behave?**  
   - What “ideal” messaging looks like  
   - What users want in the update feed  
   - Which statistics actually matter by sport  
   - What would convince them to use the app (or uninstall it)  

### **Survey structure**

The form was split into five sections:  

1. **Consent**  
   - Explicit consent question

2. **Demographic with Sports**  
   - Age range  
   - Context of team sports (casual vs registered, leagues or not)  
   - Do they actively follow sports news?  
   - Overall perceived usefulness of a sports manager app (1–5)  
   - Prior use of sports manager apps (if any)  

3. **Feature Importance (1–5 scale)**  
   - Messaging  
   - Casual game finder  
   - Personal career stats  
   - Team-finding and league-finding (join & follow)  
   - Automated scheduling  
   - Team statistics  
   - Feed of updates  

4. **Feature Breakdown**  
   - What stats they’d want tracked (by sport)  
   - Preferred messaging experience (pre-defined options)  
   - What matters most in messaging (UI, expression, information, or all)  
   - What they want most from an update feed  
   - What they’d hope most from the app overall  
   - What would turn them off

5. **Open Questions**  
   - What they’d hope most from the app overall  
   - What would turn them off


## b. Conduct Experiments

### **Recruitment & Sample**

- **Participants finding:** convenience sampling, formed shared within our personal circles targetting team sports individual.  
- **Total responses:** 12  
- **Age distribution:**  
<img width="600" height="371" alt="Count of Whats your age range_" src="https://github.com/user-attachments/assets/210b37ad-dd6e-4ed0-a76d-59006a70af7b" />

- **App usefulness rating:**  
<img width="600" height="371" alt="App Usefullness Rating" src="https://github.com/user-attachments/assets/2a90ca8d-c2d5-440b-b7c9-1ee3bdce0de7" />


### **Sports engagement**

- Everyone in the sample plays or has played team sports in some organized way, and mostly everyone keeps up with sports news:
<img width="600" height="371" alt="Count of Do you play team sports_ And if you do what context best describes you" src="https://github.com/user-attachments/assets/2a5aa085-96ca-4730-a521-6a30f73a1b6d" />

<img width="600" height="371" alt="Count of Do you actively follow sports news and events_" src="https://github.com/user-attachments/assets/c798b34d-9aea-4a06-baff-9ffd87273382" />

- This tells us the current sample leans toward **actively engaged fans/players**, which is exactly what we want our sample to look like.

### **Feature Ranking**

- This is the results for the average ranking each feature received:

<img width="804" height="497" alt="Average vs  Feature" src="https://github.com/user-attachments/assets/4176e258-c9ed-4f84-af2a-62486305d3f8" />

### **Feature Specifications**

- Messaging Prefrences:

<img width="600" height="371" alt="Count of When it comes to messaging what would be the most ideal experience" src="https://github.com/user-attachments/assets/d675614e-ee5f-4b6d-9fa1-f25c750a638c" />
<img width="600" height="371" alt="Count of What would be the most important aspect that would ensure you would use the messaging feature_" src="https://github.com/user-attachments/assets/35c37d14-5f10-4c46-a040-906cc890629f" />

- Requested stats per sports:

| **FOOTBALL (SOCCER)** | **VOLLEYBALL** | **BASKETBALL** |
|------------------------|----------------|----------------|
| Goals | Kills | Points |
| Assists | Blocks | Rebounds |
| Expected Goals | Aces | Assists |
| Chances Created | Errors | Blocks |
| Passing Accuracy | Successful Serves | Steals |
| Possession Percentage | Serve Receive Efficiency | Field Goal Percentage |
| Turnovers | Digs | Free Throw Percentage |
| One-on-One Wins | Sets | Field Goals Made and Attempted |
| Discipline (Cards and Fouls) | Bumps | Turnovers |
| Shot Types (Headers, Left or Right Foot, Bicycle Kicks, etc.) |  |  |

- Counts of most important features in feed.

<img width="600" height="371" alt="Mentions and % of respondents" src="https://github.com/user-attachments/assets/28739c44-61ca-4576-a077-39a30e3bdaa9" />

### **Open Questions**

- These are the outputs of the open questions

| **What users hope most out of a Sports Manager app** | **What would turn them off the most** |
|------------------------------------------------------|--------------------------------------|
| Replacement and scheduling management | Paywalls behind essential features |
| Detailed and insightful team and player statistics | Nothing specific (generally satisfied) |
| Ability to find and join casual games | Poor performance or lag |
| Easier discovery of teams without prior contacts or video clips | Low user base or lack of active players |
| Tools for casual users to organize matches or leagues | Turning into a generic sports news app |
| Coach-verified player statistics (not user-editable) | Lack of community engagement or utility |
| Simple scheduling with fast access and minimal clicks | Overly complicated navigation or too many pages |

## c. Result Analysis

The average usefulness rating of the app concept was 3.9/*, showing that the app has a potential market.

**Feature Importance:**  
Messaging features , team/personal statis, and finding spaces to join ranked the highest with all scoring an average above 4, while following and updates features were rated least important. In the middle we could find the scheduling features and game finder. Showing us that overall the users are more attracted to the more social aspect this app could bring over the automation.

**Messaging Behavior:**  
Most participants prefered full flexibility to create their own group chats, and 58% also indicated that they wanted the messaging feature to implment UI responsiveness, expression options, and information sharing, to ensure usage, showing that most people might be turned off by a messaging component not on the level of alternatives

**Update Feed:**  
League standings (91.7%) and scores (83.3%) dominated user preferences. Only half of respondents valued player/admin posts, and highlights were mentioned once, showing the feed should focus on information, not social posts.

**Statistical Interests:**  
Football players focused on goals, assists, and advanced analytics (xG, passing accuracy). Volleyball players listed execution-based stats like kills and serves, while basketball respondents preferred traditional box scores. Across all sports, tracking progress and performance accuracy were key desires.


## d. Interpretation

The survey data helps understand a clear picture of what early users value most: while automation of regular process is appreciated (scheduling, game finder, update feeds) the real meat is indeed in the social and competitive space the app can provide users in order to have a page for their sports career. Participants consistently responded better to usability and practicality features over more entertainment or novel features, prioritizing an app that acts as utility platform for active players.

### Sample Analysis
Our sample is primarely made up of young, active athletes who play in casual or semi-organized settings. A big chunk of our target demographic but definetly not enough of a variation to apply our findings on a broader scale. However what we can take away from this, is that a high level of polish will be required to win an audiance already so immersed in the digital space.

### Core Objective
The participants respond best to this app as a space for team coordination and personal tracking, a tool for communication, scheduling, and performance insight. With an average usefulness rating of 3.9 and no negative responses, the concept clearly resonates with the sample base, especially if executed well.

### Feature Prioritization
Based on the rankings and open responses:
- **High priority:**  
  - Viable Messaing
  - Team and personal stats
  - Automated scheduling and replacement management  
  - Team/league joining features  

- **Medium priority:**  
  - Casual game finder  
  - Feed of updates

- **Low priority:**  
  - “Follow” functionality for teams/leagues

### Feature Design
- **Messaging:** Must be as fluid and reliable as existing platforms, users might not use it if its laggy or cluttered. Giving group creation flexibility seems essential.
- **Feed:** Should primarily display standings, scores, and schedules not social chatter like linkdin.  
- **Statistics:** Each sport needs its own set of stats, a good start is looking at what participants mentioned.
- **Accessibility:** Emphasize fast navigation and clear UI pathways, “Too many clicks” was cited as a top frustration.

### Risks
The highlighted risks derived from responses are:
- Particiapnts strongly dislike essential features behind a paywall. 
- The app must launch with enough users or teams to feel “alive.”  
- A bloated or hard-to-navigate design would discourage casual users.

### Strategic Insight
The results confirm that our best opportunity lies in creating an efficient coordination ecosystem not a social app or content feed. By solving scheduling, communication, stat tracking, the app can become a key tool for teams and leagues.

