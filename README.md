# Clinic Companion Pro

I have attached/provided the complete existing source code for my **Meridian Clinic — Care Management** website.

I want you to **modify and upgrade the existing website**, not create a completely different project.

IMPORTANT:

* First inspect the entire existing code carefully.
* Understand the current architecture, UI, authentication, data model, appointments, doctors, patients, medical records, prescriptions, billing, notifications, and navigation.
* Preserve the existing design and working features wherever possible.
* Fix existing bugs instead of removing existing functionality.
* Implement the new requirements below properly.
* Do not give me only suggestions or explanations. Actually modify the code.
* Keep the application fully functional after all changes.
* Make the UI professional, responsive, accessible, and easy to use.
* Do not use fake buttons that do nothing. Every visible feature should have working demo functionality.
* Since this is currently a prototype, clearly separate mock/demo functionality from functionality that would require a real backend.

# 1. FIX LOGIN EMAIL VALIDATION

There is currently a major problem:

If the user enters an incorrect email format, the application may still allow login.

Fix this completely.

Before attempting authentication:

Validate email using a proper email format such as:

[example@gmail.com](mailto:example@gmail.com)

Reject:

* abc
* abc@
* @gmail.com
* abc@gmail
* abc..com
* [abc@.com](mailto:abc@.com)
* spaces inside email
* empty email

When invalid:

Show a clear error:

"Please enter a valid email address."

Do NOT attempt login until the email format is valid.

Also:

* Trim leading/trailing spaces.
* Normalize email appropriately.
* Password cannot be empty.
* Show a clear "Invalid email or password" message when credentials are incorrect.
* Never allow login merely because the email field contains text.
* Prevent accidental authentication bypass.

# 2. THREE-LANGUAGE SYSTEM

At the very beginning of the application, before the user enters the main application, show a language selection screen.

Languages:

1. English
2. తెలుగు (Telugu)
3. हिन्दी (Hindi)

Example:

"Choose your language"

[ English ]
[ తెలుగు ]
[ हिन्दी ]

The selected language should be remembered for the current session and preferably persisted.

The UI should dynamically change important interface text according to the selected language.

Translate:

* Login
* Register
* Dashboard
* Patients
* Doctors
* Appointments
* Medical Records
* Prescriptions
* Billing
* Emergency
* Voice Assistant
* Video Consultation
* Call Doctor
* Logout
* Settings
* Admin
* Validation messages
* Appointment messages
* Basic patient instructions
* Buttons
* Forms
* Error messages

Do not translate medical doctor names or database IDs.

Design the language system so additional languages can be added later.

# 3. ACCESSIBILITY FOR PEOPLE WHO CANNOT READ WELL

A major purpose of this application is helping patients who may:

* have low literacy
* not understand English
* not know how to type
* not understand complicated medical terminology

Therefore create a very simple patient interface.

Use:

* Large buttons
* Clear icons
* Simple labels
* Voice interaction
* Text-to-speech
* Speech-to-text
* Visual cards
* Simple instructions

For example:

🎤 "Tell us your problem"

The patient should be able to speak instead of typing.

Provide a prominent:

"🎤 Speak"

button.

When the user speaks:

* Convert speech to text using browser speech recognition where supported.
* Display the recognized text.
* Allow the user to confirm/edit it.
* Use the result for symptom/disease matching.

Also provide text-to-speech so the application can read important messages to the patient.

For example:

"Your appointment is confirmed for 10 AM."

The application should be able to speak this message in the selected language where browser support is available.

If speech APIs are unavailable, show a graceful fallback message.

# 4. VOICE CHAT / VOICE COMMUNICATION

Add a patient communication section.

Patient should have options:

[ 🎤 Voice Message ]
[ 📞 Voice Call ]
[ 🎥 Video Call ]

Voice message:

* Record voice using browser MediaRecorder API.
* Show recording timer.
* Start recording.
* Stop recording.
* Playback recording.
* Allow deleting/re-recording.
* Show recording status.

Do not pretend the recording is being sent to a real doctor unless a backend is connected.

For prototype mode, demonstrate the complete UI and local recording functionality.

# 5. VIDEO CONSULTATION

Add a Video Consultation feature.

Patient should be able to click:

"Start Video Consultation"

Show a professional video consultation interface containing:

* Patient video area
* Doctor video area
* Microphone button
* Camera button
* End call button
* Call duration
* Connection status
* Chat panel
* Language indicator

For the MVP/prototype:

* Use browser camera/microphone permissions where possible.
* If real WebRTC doctor-to-patient communication is not configured, clearly indicate "Demo consultation".
* Do NOT falsely claim that a real remote doctor connection exists.

Structure the code so real WebRTC/backend signaling can be connected later.

# 6. VOICE CALL

Add a "Call Doctor" option.

For demo mode:

* Display call screen.
* Show doctor name.
* Show specialization.
* Show call status.
* Start/stop call UI.
* Show call timer.

If a real phone number is available, allow a tel: link where appropriate.

Do not expose sensitive doctor information unnecessarily.

# 7. DISEASE / SYMPTOM BASED DOCTOR SUGGESTION

This is an important feature.

When the patient enters or speaks a disease/symptom, analyze the input and suggest the appropriate specialization.

Examples:

"heart attack"
"chest pain"
"heart problem"
"palpitations"

→ suggest:

❤️ Cardiology

Example:

"skin allergy"
"rash"
"acne"

→ Dermatology

Example:

"bone fracture"
"joint pain"
"back pain"

→ Orthopedics

Example:

"fever"
"cold"
"general weakness"

→ General Medicine

Example:

"child fever"
"child cough"

→ Pediatrics

Do NOT present the prototype keyword matching as a medical diagnosis.

Use wording such as:

"Based on the information entered, you may consider consulting a Cardiology specialist."

Add an important disclaimer:

"This suggestion is for appointment guidance only and is not a medical diagnosis. For severe or emergency symptoms, seek emergency medical care immediately."

# 8. EMERGENCY / HEART ATTACK HANDLING

If the user enters phrases such as:

* heart attack
* severe chest pain
* difficulty breathing
* unconscious
* severe bleeding
* stroke symptoms

Do NOT simply treat it as a normal appointment.

Display a prominent emergency warning.

Example:

"⚠️ Possible emergency"

"Please seek emergency medical care immediately."

Provide:

[ Emergency Help ]
[ Call Emergency Services ]
[ Contact Hospital ]

The exact emergency workflow should be configurable by the hospital/admin.

Do not claim that the system can medically diagnose a heart attack.

# 9. SMART DOCTOR AVAILABILITY

Improve the appointment system.

When a patient wants a particular doctor at a particular time:

First check:

* Doctor working day
* Doctor working hours
* Existing appointments
* Existing conflicts
* Doctor availability
* Leave/unavailable status

If the selected doctor is unavailable at that time, DO NOT simply book the appointment.

Instead show:

"Dr. Priya Sharma is unavailable at this time."

Then show:

"Available doctors with the same specialization:"

Example:

Dr. Priya Sharma
Cardiology
Unavailable at 11:00 AM

Available:

Dr. X
Cardiology
11:30 AM

Dr. Y
Cardiology
12:00 PM

Provide:

[Book this doctor]

# 10. AUTOMATIC DOCTOR REASSIGNMENT

If a patient already has an appointment but the original doctor becomes unavailable due to:

* emergency
* leave
* urgent hospital duty
* unexpected absence

The system should attempt reassignment.

Priority:

1. Same doctor
2. Same specialization in the same hospital
3. Another doctor with equivalent specialization
4. Nearby hospital with the same specialization
5. If no immediate replacement exists, show alternative available slots

The system must NOT silently change the doctor.

Show the patient:

"Your original doctor is unavailable."

"Would you like to continue with another Cardiology specialist?"

Then show the alternatives.

Allow patient/admin confirmation.

# 11. NEARBY HOSPITAL REFERRAL

If the current hospital does not have the required specialization:

Example:

Patient requires Cardiology.

Current hospital:
No cardiologist available.

Then show:

"Specialist unavailable at this hospital."

Show nearby hospitals with:

* Hospital name
* Distance
* Specialization
* Available doctor
* Available appointment time
* Emergency availability where applicable

For the prototype, nearby hospital data can be mock data.

Structure it so real maps/location APIs can be connected later.

# 12. APPOINTMENT PRIORITY / URGENT CASES

Add appointment priority:

* Emergency
* Urgent
* Normal
* Follow-up

Urgent cases should be visually highlighted.

However, do not automatically cancel another patient's appointment without proper authorization.

The admin should have control over reassignment and emergency scheduling.

# 13. ADMIN MUST HAVE THE HIGHEST PRIVILEGE

This is extremely important.

The system must have strict role-based access control.

Roles:

ADMIN
DOCTOR
PATIENT

Admin has the highest privilege.

Only ADMIN can access:

* Complete hospital details
* All patients
* All doctors
* Complete medical records
* Complete appointment database
* Billing information
* Hospital configuration
* User management
* Audit logs
* Security settings
* Recent records management
* Hospital statistics
* Doctor availability management
* Appointment reassignment
* Hospital-to-hospital referrals

Patient must NEVER see the admin dashboard.

Doctor must NEVER see the admin dashboard.

Patient should only see their own information.

Doctor should only see information necessary for their authorized patients/appointments.

# 14. ADMIN DASHBOARD SECURITY

Do NOT merely hide the Admin menu.

Actually enforce authorization in the application logic.

Example:

if currentUser.role !== "admin"

then deny access.

Do not rely only on:

* CSS
* hidden buttons
* hidden routes
* frontend visibility

because hiding a button is not security.

For a production implementation, authorization must also be enforced by the backend/database.

Since this current application is a prototype/localStorage application, clearly mark that the security is prototype-level and that real deployment requires server-side authentication and authorization.

# 15. ADMIN LOGIN

Create a separate secure-looking admin entry.

Example:

"Hospital Administration"

Admin login should require:

* Email
* Password
* Optional second authentication layer/OTP-ready architecture

Do not expose admin credentials in the public patient UI.

Do not display admin password anywhere in the interface.

If demo credentials are required, keep them clearly marked as development/demo credentials and make it easy to replace them.

# 16. MEDICAL RECORD PRIVACY

Medical records are sensitive.

Implement role-based visibility.

PATIENT:

* Can see only their own records.

DOCTOR:

* Can see records required for their authorized patient care.

ADMIN:

* Can manage/access complete records.

Recent records should NOT be publicly visible.

Do not display:

* Patient diagnosis
* Prescription
* Medical history
* Phone number
* Address
* Blood group

on public pages.

# 17. RECENT RECORDS CONTROL

The "Recent Records" section should be admin-controlled.

Admin can:

* View
* Add
* Edit
* Archive
* Restore
* Delete where appropriate
* Control visibility

Patients should only see records belonging to themselves.

Doctors should only see authorized patient records.

# 18. AUDIT LOG

Add an Admin-only Audit Log.

Record important actions such as:

* Login
* Failed login
* Patient created
* Patient updated
* Appointment created
* Appointment reassigned
* Doctor marked unavailable
* Medical record created
* Prescription created
* Record accessed
* Record archived
* Admin settings changed

Example:

"Admin changed appointment APT-1021 from Dr. X to Dr. Y."

Include:

* timestamp
* user
* role
* action
* affected record
* status

# 19. DOCTOR AVAILABILITY MANAGEMENT

Admin should be able to configure:

* Working days
* Working hours
* Breaks
* Leave
* Emergency unavailability
* Appointment duration
* Maximum appointments
* Consultation mode

Doctor should also be able to mark themselves unavailable where allowed, but admin retains final control for scheduling.

# 20. PATIENT APPOINTMENT EXPERIENCE

Create a simple step-by-step booking process:

STEP 1:
Describe your problem

Text or voice input.

STEP 2:
System suggests specialization.

Example:

"Possible department: Cardiology"

STEP 3:
Show available doctors.

STEP 4:
Select date.

STEP 5:
Select available time.

STEP 6:
Choose consultation:

* In-person
* Voice call
* Video consultation

STEP 7:
Confirm appointment.

STEP 8:
Show appointment confirmation.

# 21. LANGUAGE-AWARE VOICE

The voice assistant should use the selected language.

English:
English speech recognition / speech output.

Telugu:
Telugu speech recognition / speech output if browser supports it.

Hindi:
Hindi speech recognition / speech output if browser supports it.

Use appropriate BCP-47 language codes such as:

en-IN
te-IN
hi-IN

Provide fallback behavior if browser support is unavailable.

# 22. SIMPLE PATIENT MODE

Create a simplified patient dashboard.

Large cards:

🩺 Find Doctor

📅 Book Appointment

🎤 Speak Your Problem

📞 Call Doctor

🎥 Video Consultation

📋 My Medical Records

💊 My Medicines

🚨 Emergency Help

🌐 Change Language

Avoid overwhelming the patient with administrative tables.

# 23. DOCTOR DASHBOARD

Doctor dashboard should include:

* Today's appointments
* Upcoming appointments
* Patient queue
* Availability status
* Start consultation
* Voice call
* Video call
* Patient medical history
* Add medical record
* Add prescription
* Appointment notes

But do not expose unrelated patients' private data.

# 24. ADMIN DASHBOARD

Admin dashboard should have:

* Total patients
* Total doctors
* Today's appointments
* Pending appointments
* Emergency cases
* Available doctors
* Unavailable doctors
* Revenue
* Recent activities
* Appointment reassignment
* Hospital configuration
* User management
* Medical records control
* Audit logs
* Security settings

Admin should have the most complete control.

# 25. SECURITY IMPROVEMENTS

Review the entire existing application for security weaknesses.

Important:

The existing application uses localStorage for demo data/session.

Do NOT claim that localStorage is production-grade security.

For the prototype:

* Validate inputs.
* Escape user-generated HTML.
* Prevent obvious XSS.
* Avoid exposing passwords in UI.
* Implement role checks.
* Prevent unauthorized navigation.
* Clear session properly on logout.
* Avoid storing unnecessary sensitive data in localStorage.
* Add session timeout architecture if practical.

For production architecture, recommend:

* Backend authentication
* Password hashing
* HTTPS
* Secure HttpOnly cookies
* Server-side authorization
* Database row-level security
* Audit logging
* Encryption for sensitive data
* Secure WebRTC signaling
* Proper medical-data compliance requirements

# 26. RESPONSIVE DESIGN

Make sure the new functionality works on:

* Desktop
* Laptop
* Tablet
* Mobile

Especially make:

* Voice button
* Call button
* Video button
* Emergency button
* Language selector

easy to access on mobile.

# 27. PRESERVE EXISTING DATA

Do not unnecessarily delete the existing seed data.

Preserve:

* Doctors
* Patients
* Appointments
* Medical records
* Prescriptions
* Invoices
* Notifications

Extend the data model where required.

For example:

doctor:
availability
leave
consultationModes

appointment:
priority
consultationType
originalDoctorId
reassignedDoctorId
reassignmentReason
reassignmentStatus

patient:
preferredLanguage

communication:
voiceMessages
calls
videoConsultations

auditLog:
timestamp
userId
role
action
targetId

# 28. ERROR HANDLING

Every form should have proper validation.

Examples:

Invalid email:
"Please enter a valid email address."

Empty password:
"Password is required."

Invalid appointment:
"This doctor is not available at the selected time."

No specialist:
"No doctor with this specialization is currently available."

Microphone permission denied:
"Microphone access is required for voice recording."

Camera permission denied:
"Camera access is required for video consultation."

# 29. IMPORTANT MEDICAL SAFETY

This is a healthcare management application.

Do not make the application claim that it can diagnose diseases.

The disease/symptom feature should only:

"Suggest an appropriate department/specialist."

For emergencies, clearly direct users to emergency medical care.

Do not generate treatment recommendations automatically.

Do not automatically prescribe medicines.

# 30. DO NOT BREAK EXISTING FEATURES

After implementation, test:

* Login
* Logout
* Invalid email
* Wrong password
* Patient dashboard
* Doctor dashboard
* Admin dashboard
* Appointment booking
* Appointment conflict detection
* Doctor reassignment
* Medical records
* Prescriptions
* Billing
* Notifications
* Language selection
* Voice recording
* Speech recognition
* Text-to-speech
* Video consultation demo
* Voice call demo
* Role-based access
* Admin-only areas
* Responsive mobile UI

# 31. FINAL QUALITY REQUIREMENT

After making all changes:

1. Inspect the complete project.
2. Find JavaScript errors.
3. Find broken event handlers.
4. Find broken buttons.
5. Find invalid DOM references.
6. Check login flow.
7. Check role permissions.
8. Check appointment conflict logic.
9. Check language switching.
10. Check voice features.
11. Check responsive design.
12. Fix any issues you find.

Do not simply tell me what you would change.

Actually implement the changes in the existing project.

At the end, give me a concise summary containing:

* What was fixed
* What new features were added
* What security improvements were made
* What is demo/mock functionality
* What would require a real backend/API for production
* Any remaining limitations

Most importantly:

**Keep the existing Meridian Clinic website's overall design and functionality, but turn it into a much more accessible, multilingual, secure, patient-friendly hospital/clinic management system with strong admin control, smart specialist matching, appointment reassignment, voice interaction, voice calls, and video consultation.**
Modify my existing **Meridian Clinic — Care Management** website. Do NOT rebuild the project from scratch and do NOT remove any existing functionality.

I specifically need you to **fully implement**, not just design, the following features.

## 1. THREE-LANGUAGE SYSTEM — ACTUALLY WORKING

Add a language selection screen **before the user enters the main application**.

Languages:

* English
* తెలుగు (Telugu)
* हिंदी (Hindi)

Requirements:

* User selects a language.
* Save the selected language in the current session/localStorage.
* The complete patient-facing interface must change according to the selected language.
* Translate:

  * Login
  * Registration
  * Dashboard
  * Appointment booking
  * Doctor information
  * Symptoms
  * Emergency messages
  * Buttons
  * Forms
  * Notifications
  * Voice controls
  * Video consultation labels
  * Error messages
* Do NOT simply create three buttons that do nothing.
* Create a proper translation dictionary such as:

```js
const translations = {
  en: {...},
  te: {...},
  hi: {...}
}
```

and use it throughout the application.

## 2. REAL VOICE INPUT

The voice button must actually work.

Implement browser voice recognition using the Web Speech API where supported:

```js
window.SpeechRecognition || window.webkitSpeechRecognition
```

Requirements:

* Microphone button.
* Start recording when clicked.
* Show "Listening..." state.
* Convert speech → text.
* Put the recognized text into the active input/search/symptom field.
* Stop recording button.
* Handle microphone permission errors.
* Handle unsupported-browser errors.
* Language must automatically follow the selected language:

English:
`en-IN`

Telugu:
`te-IN`

Hindi:
`hi-IN`

Example:

Patient selects Telugu → clicks microphone → speaks Telugu → Telugu speech is converted into Telugu text.

DO NOT create a fake microphone button.

## 3. VOICE CHAT / SPOKEN CONVERSATION

Add a proper **Voice Assistant / Voice Chat** interface for patients.

Flow:

Patient clicks:

"🎤 Start Voice Chat"

Then:

1. Ask microphone permission.
2. Start speech recognition.
3. Convert patient's speech to text.
4. Display the patient's message in the chat.
5. Generate the appropriate clinic response using the existing mock/demo logic.
6. Convert the response from text → speech using `SpeechSynthesis`.
7. Speak the response aloud.
8. Continue listening for the next message.

Controls:

* Start Voice Chat
* Stop Voice Chat
* Mute
* Replay response
* Clear conversation

The voice should use the selected language.

Use:

```js
window.speechSynthesis
```

for text-to-speech.

Use appropriate voices where the browser provides them.

IMPORTANT:
Do not claim this is a real medical AI diagnosis system. It is a clinic navigation/assistance demo.

## 4. VOICE RECORDING

Also add a separate voice-recording option for patients.

Use:

```js
MediaRecorder
navigator.mediaDevices.getUserMedia({ audio: true })
```

Features:

* Start recording
* Stop recording
* Recording timer
* Playback recorded audio
* Delete recording
* Attach recording to an appointment/request

Clearly show:

🔴 Recording...

and then:

▶ Play Recording

If browser permissions are denied, display a useful error message.

## 5. VIDEO CONSULTATION — ACTUALLY FUNCTIONAL

Implement a real browser-based video consultation prototype.

Use:

```js
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
})
```

Create a consultation screen with:

* Patient video
* Doctor video
* Camera on/off
* Microphone on/off
* End call
* Full screen
* Call duration timer
* Connection status

Use WebRTC architecture:

```js
RTCPeerConnection
```

for the video-call structure.

If a real backend/signaling server is not available in the current project, create a **working local/demo WebRTC structure** and clearly mark the missing signaling/backend integration.

DO NOT create a button that only displays "Video Call Coming Soon".

The camera and microphone must actually request browser permissions and display the local camera stream.

## 6. APPOINTMENT → VIDEO CALL

When an appointment is marked as:

"Online Consultation"

show:

"Join Video Consultation"

button.

The doctor dashboard should also have:

"Start Consultation"

When both sides are connected, show the video consultation interface.

## 7. ADMIN PASSWORD SECURITY

This is VERY IMPORTANT.

When the user clicks:

"Continue as Admin"

DO NOT immediately open the admin dashboard.

Instead open:

### Admin Authentication

Fields:

* Admin Email
* Admin Password

The admin must enter the correct password before accessing hospital records.

For the current demo/prototype, create a dedicated admin credential such as:

```text
Email: admin@meridian.demo
Password: MeridianAdmin@2026
```

Do NOT display the password anywhere in the admin dashboard.

Flow:

```text
Continue as Admin
        ↓
Admin Login
        ↓
Enter Email + Password
        ↓
Validate Credentials
        ↓
Correct
        ↓
Admin Dashboard
```

Wrong password:

```text
Invalid admin credentials.
Access denied.
```

Do NOT allow the user to bypass this by manually changing a UI variable.

## 8. ADMIN ROLE PROTECTION

The admin dashboard must contain:

* Hospital information
* Doctors
* Patients
* Appointments
* Medical records
* Prescriptions
* Billing
* Reports
* System configuration
* Security
* Audit logs
* Recent records

Patients and doctors must NOT be able to access these admin sections.

Implement role guards.

Example:

```js
if (currentUser.role !== "admin") {
    denyAccess();
}
```

But do not rely only on hiding buttons.

Every admin route/view/action must verify the authenticated role.

## 9. ADMIN SESSION SECURITY

After successful admin login:

* Create an authenticated admin session.
* Store only the minimum required session information.
* Add logout.
* Clear admin session on logout.
* Prevent accessing admin pages after logout.
* If possible, implement session timeout.

For this frontend prototype, explain in comments that production authentication must be moved to the backend with secure password hashing and server-side authorization.

DO NOT store a plaintext admin password as a normal publicly accessible UI variable in production-style code.

For the demo, keep the credential clearly isolated so it can later be replaced by backend authentication.

## 10. PATIENT ACCESS CONTROL

Patients should only see:

* Their own profile
* Their own appointments
* Their own medical records
* Their own prescriptions
* Their own bills
* Their own consultations
* Their own voice recordings

A patient must never be able to select another patient's ID from the UI and see their records.

## 11. DOCTOR ACCESS CONTROL

Doctors should see:

* Their own profile
* Their assigned appointments
* Authorized patient information
* Relevant medical records
* Consultation information
* Appointment status

Doctors must not see unrestricted hospital administration data.

## 12. SYMPTOM → SPECIALIST SUGGESTION

Add a patient-friendly symptom assistant.

Example:

Patient enters:

"chest pain"

System should suggest:

"Possible department to consult: Cardiology"

Examples:

* Chest pain → Cardiology
* Skin rash → Dermatology
* Child fever → Pediatrics
* Joint pain → Orthopedics
* Fever/cold → General Medicine

IMPORTANT:

This must be presented as:

"Suggested department"

NOT:

"You have heart disease."

Never diagnose the patient.

For severe symptoms, show an emergency warning recommending immediate emergency medical care.

## 13. EMERGENCY APPOINTMENT PRIORITY

Appointment types:

* Emergency
* Urgent
* Normal
* Follow-up

Emergency appointments must be visually highlighted.

When emergency symptoms are detected, show an emergency notice before normal booking flow.

Do not pretend the system can medically diagnose an emergency.

## 14. DOCTOR AVAILABILITY

Doctors must have availability status:

* Available
* Busy
* On Leave
* Offline

When booking an appointment:

1. Check doctor availability.
2. Check date.
3. Check time.
4. Check existing appointment conflicts.

Do not allow double booking.

## 15. AUTOMATIC DOCTOR REASSIGNMENT

If a booked doctor becomes unavailable:

First search for another doctor with the SAME specialization.

Example:

Dr. Priya Sharma → Cardiology

If unavailable:

Search available cardiologists.

If another cardiologist exists:

Automatically suggest:

"Dr. Priya Sharma is unavailable. Dr. [Name], Cardiology, is available at [time]. Would you like to reassign your appointment?"

If no same-specialization doctor exists:

Show nearby hospital referral information.

Use mock nearby hospitals for the prototype.

## 16. NEARBY HOSPITAL REFERRAL

If the clinic has no suitable doctor:

Show:

* Hospital name
* Department
* Address
* Phone
* Emergency availability
* Distance (mock/demo data if location API is unavailable)

Include:

"Contact Hospital"

and

"Get Directions"

buttons.

Do not claim real-time distance unless an actual location API is connected.

## 17. SIMPLE PATIENT BOOKING FLOW

Patient booking should be very simple:

```text
Choose Department
        ↓
Choose Doctor
        ↓
Choose Date
        ↓
Choose Time
        ↓
Choose Consultation Type
        ↓
Normal / Urgent / Emergency / Follow-up
        ↓
Confirm Appointment
```

Avoid unnecessary complicated forms.

## 18. ADMIN HOSPITAL RECORDS

After successful admin authentication, the admin should be able to manage:

### Hospital

* Hospital details
* Departments
* Contact information
* Emergency information

### Doctors

* Add
* Edit
* Remove
* Specialization
* Availability
* Schedule

### Patients

* View
* Search
* Edit
* Patient history

### Appointments

* View
* Approve
* Cancel
* Reassign
* Reschedule

### Medical Records

* View
* Add
* Update

### Prescriptions

* View
* Manage

### Billing

* Invoices
* Payments
* Outstanding balances

### Reports

* Appointments
* Patients
* Doctors
* Revenue

### Audit Log

Record important admin actions.

Example:

```text
Admin logged in
Admin viewed patient record
Admin changed appointment
Admin reassigned doctor
Admin updated doctor availability
```

## 19. UI REQUIREMENTS

Keep the existing Meridian Clinic design.

Use:

* Responsive design
* Mobile-friendly interface
* Clean cards
* Clear icons
* Large buttons for patients
* Accessible contrast
* Simple navigation

For voice features, make buttons clearly visible:

🎤 Voice Input

🎙 Voice Chat

🔴 Record

📹 Video Consultation

## 20. IMPORTANT IMPLEMENTATION RULE

Do NOT just create UI placeholders.

For every feature, ask:

"Does this actually work when the user clicks it?"

If the answer is no, implement the functionality.

Especially:

* Language switching must work.
* Microphone must work.
* Speech-to-text must work.
* Text-to-speech must work.
* Voice chat must work.
* Audio recording must work.
* Camera must work.
* Video preview must work.
* Admin password authentication must work.
* Admin role protection must work.
* Appointment conflict detection must work.

## 21. EXISTING DATA

Do NOT delete the existing Meridian Clinic demo data.

Preserve existing:

* Doctors
* Patients
* Appointments
* Medical records
* Prescriptions
* Invoices
* Users

Current demo admin:

```text
admin@meridian.demo
```

Replace the old admin authentication with the new protected admin login flow.

## 22. ERROR HANDLING

Handle:

* Microphone permission denied
* Camera permission denied
* Browser does not support speech recognition
* Browser does not support speech synthesis
* Camera unavailable
* Microphone unavailable
* Invalid admin password
* Unauthorized access
* Doctor unavailable
* Appointment conflict
* Missing required fields
* Invalid email

Do not allow the application to crash.

## 23. PRODUCTION SECURITY NOTE

The current project is a frontend/demo application using localStorage.

Therefore, implement the prototype correctly, but add comments explaining that production deployment must use:

* Backend authentication
* Password hashing using Argon2/bcrypt
* Secure sessions or HttpOnly cookies
* Server-side role authorization
* Database access control
* Audit logging
* HTTPS
* WebRTC signaling server
* Proper encrypted medical data storage

Never describe localStorage authentication as production-secure.

## 24. FINAL TESTING

After implementation:

Test these exact flows:

### Test 1

Select Telugu → patient dashboard → verify UI changes to Telugu.

### Test 2

Select Hindi → verify UI changes to Hindi.

### Test 3

Click microphone → speak → verify speech becomes text.

### Test 4

Start Voice Chat → speak → receive text response → response is spoken aloud.

### Test 5

Start recording → record → stop → playback.

### Test 6

Start video consultation → camera permission → local video appears.

### Test 7

Click Continue as Admin → verify password screen appears.

### Test 8

Enter wrong password → verify access denied.

### Test 9

Enter correct admin credentials → verify admin dashboard opens.

### Test 10

Logout admin → try opening admin area → verify access is denied.

### Test 11

Book appointment → create conflict → verify double booking is prevented.

### Test 12

Make doctor unavailable → verify reassignment to same-specialization doctor.

### Test 13

No same-specialization doctor → verify nearby hospital referral.

### Test 14

Patient attempts to access another patient's record → verify access denied.

## FINAL REQUIREMENT

Before finishing, inspect the entire existing codebase and integrate these features into the current architecture.

Do NOT give me only explanations.

Actually modify the code.

Do NOT replace working existing features with placeholders.

Do NOT create fake buttons.

Do NOT say "this can be implemented later."

Implement as much as possible now using browser APIs and the existing frontend architecture, and clearly identify only the parts that genuinely require a backend/server, such as production authentication, persistent medical-data security, and WebRTC signaling.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/714b01d9-1b38-41b2-b8af-41d955e5073d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
