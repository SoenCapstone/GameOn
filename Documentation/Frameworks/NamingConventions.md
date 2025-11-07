# Naming Conventions

To maintain clarity and consistency across the GameOn project, we follow a set of simple and unified naming conventions. These rules apply to all code, folders, commits, and branches, and are meant to make the project more readable, easier to navigate, and consistent for everyone contributing.

---

## 1. Files and Folders

All folder names should use kebab-case, meaning lowercase letters with words separated by hyphens.
Examples: `user-service`, `team-management`, `game-session-handler`

File names should reflect the main class or component inside.
For example, `UserController.java` for a Java class, or `team-service.js` for a JavaScript service.

Configuration files should be written in lowercase and may use underscores for readability, like `application_config.yaml`.
Test files should follow the same naming as the file being tested, with `_test` or `.spec` appended — for example `UserService_test.java` or `team.service.spec.ts`.

Keeping file names consistent helps avoid confusion and ensures that developers can easily locate files, even in large modules.

---

## 2. Code (Classes, Methods, Variables)

Class names must use PascalCase, starting with a capital letter and no separators.
For instance: `TeamService`, `GameController`, or `PlayerProfile`.

Methods and variables should use camelCase, starting with a lowercase letter.
Examples: `getTeamById()`, `updatePlayerScore()`, `userCount`, `teamList`.

Constants should always be in UPPER_SNAKE_CASE — like `MAX_PLAYER_COUNT` or `DEFAULT_TIMEOUT`.
Enums can be written in PascalCase or UPPER_SNAKE_CASE, depending on the team’s choice — for example `Status.Active` or `ACTIVE_STATUS`.

Interfaces can be prefixed with a capital “I” if it improves clarity, such as `IUserRepository`.

Using these consistent rules keeps the codebase readable and uniform across both backend (Java/Spring Boot) and frontend (TypeScript/React Native) modules.

---

## 3. Commit Message Convention

We follow the Conventional Commits format to keep our commit history clean and easy to understand.
Each commit should include the GitHub issue number, the purpose of the change, and a short, clear message.

**Format:**
```
GH-#: [purpose] Message
```

**Example:**
```
GH-2: [feat] Added new endpoint for player stats
```

`GH-#` refers to the related GitHub issue or task number.
`[purpose]` indicates the type of change (for example, feat, fix, docs, etc.).
The message briefly describes what was done, written in sentence case.

Accepted purposes include:
- feat — new features
- fix — bug fixes
- docs — documentation changes
- style — formatting or style updates
- refactor — code improvements without behavior change
- test — adding or updating tests
- chore, build, ci, perf, revert — as needed for maintenance or automation tasks

This approach makes it easier to track what each commit does, and ties every change directly to its corresponding issue.

---

## 4. Branch Naming Convention

Branches should follow a clear and descriptive naming pattern.
The general format is:

```
<category>/<reference>/<description-in-kebab-case>
```

The category indicates the type of work, such as:
- feature — adding, updating, or removing a feature
- bugfix — fixing a bug
- hotfix — urgent or temporary patch
- test — experimental or testing work

The reference is the related issue or ticket number, such as `issue-42`.
If there’s no issue, use `no-ref`.

The description should briefly explain what the branch is about, written in kebab-case (lowercase words separated by hyphens).

**Examples:**
- feature/issue-42/create-new-button-component
- bugfix/issue-342/button-overlap-form-on-mobile
- hotfix/no-ref/registration-form-not-working
- test/no-ref/refactor-components-with-atomic-design

Following this structure keeps the repository organized and makes it easy to identify the purpose of each branch at a glance.

---

## 5. Naming Exceptions

Avoid unnecessary abbreviations unless they’re standard, such as id, db, or UI.
Prefer full descriptive names instead of short or cryptic ones — for example, `userController` is better than `usrCtrl`.

Always aim for clarity and consistency across all parts of the system, including backend, frontend, and configuration layers.

---

## 6. Rationale

Following these conventions ensures that:
- The codebase remains consistent and readable.
- Team members can easily understand each other’s work.
- The project is easier to maintain and extend.
- Onboarding new contributors becomes faster and smoother.

These rules are not meant to be strict limitations, but rather a shared standard to help keep the GameOn project clean, professional, and scalable.

---

## Acceptance Criteria

- Naming conventions documented for code and assets.
- Patterns follow project-wide standards.
- Examples are included for clarity.
