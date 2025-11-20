# 🚀 Quick Start Guide - Workflow Automation

## 5-Minute Setup

### Step 1: Create an SLA Policy (30 seconds)

**What it does:** Sets time limits for responding to and resolving tickets

**Example:**
```bash
curl -X POST http://localhost:4000/api/workflows/sla-policies \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Standard High Priority",
    "priority": "high",
    "responseTimeMinutes": 240,
    "resolutionTimeMinutes": 1440,
    "businessHoursOnly": true,
    "escalationEnabled": true
  }'
```

**Translation:**
- High priority tickets must be responded to within 4 hours
- Must be resolved within 24 hours
- Only count business hours (Mon-Fri, 9-5)
- Escalate if SLA is breached

---

### Step 2: Create an Assignment Rule (30 seconds)

**What it does:** Automatically assigns new tickets to the least busy technician

**Example:**
```bash
curl -X POST http://localhost:4000/api/workflows/assignment-rules \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Auto-Assign All Tickets",
    "description": "Distribute tickets evenly",
    "isActive": true,
    "priority": 100,
    "conditions": {},
    "assignmentType": "least_busy"
  }'
```

**Translation:**
- Apply to ALL tickets (no conditions)
- Use "least busy" strategy
- Highest priority (runs first)

---

### Step 3: Create a Workflow (1 minute)

**What it does:** Automatically responds to critical tickets

**Example:**
```bash
curl -X POST http://localhost:4000/api/workflows/templates \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Critical Ticket Alert",
    "entityType": "ticket",
    "trigger": "created",
    "isActive": true,
    "conditions": [
      {
        "field": "priority",
        "operator": "equals",
        "value": "critical"
      }
    ],
    "actions": [
      {
        "type": "add_comment",
        "params": {
          "comment": "This is a critical ticket! We are on it immediately. Expected response within 1 hour."
        }
      }
    ]
  }'
```

**Translation:**
- When a ticket is created
- If priority is "critical"
- Automatically add a reassuring comment

---

### Step 4: Test It! (30 seconds)

**Create a test ticket:**
```bash
curl -X POST http://localhost:4000/api/tickets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Urgent: Server is down!",
    "description": "Production server is not responding",
    "priority": "critical",
    "createdById": "YOUR_USER_ID"
  }'
```

**What happens automatically:**
1. ✅ Ticket is created
2. ✅ SLA tracker starts (1 hour response, 4 hours resolution)
3. ✅ Auto-assigned to least busy tech
4. ✅ Workflow adds automatic comment
5. ✅ Notifications sent to all admins

**All in < 1 second! ⚡**

---

## 📊 Check the Results

### View SLA Stats
```bash
curl http://localhost:4000/api/workflows/sla-stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "total": 1,
  "onTrack": 1,
  "atRisk": 0,
  "breached": 0,
  "complianceRate": "100.0"
}
```

### View Assignment Stats
```bash
curl http://localhost:4000/api/workflows/assignment-stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "activeRules": 1,
  "availableTechnicians": 3,
  "technicianWorkload": [
    {
      "name": "Sarah",
      "activeTickets": 3,
      "isAvailable": true
    },
    {
      "name": "Mike",
      "activeTickets": 5,
      "isAvailable": true
    }
  ]
}
```

### View Workflow Executions
```bash
curl http://localhost:4000/api/workflows/executions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
[
  {
    "workflowId": "xxx",
    "workflow": {
      "name": "Critical Ticket Alert"
    },
    "status": "completed",
    "result": {
      "actions": [
        {
          "type": "add_comment",
          "success": true
        }
      ]
    },
    "executedAt": "2025-11-20T10:15:30.000Z"
  }
]
```

---

## 🎯 Common Use Cases

### Use Case 1: Priority-Based Assignment

**Goal:** Critical tickets go to senior tech, others distributed evenly

```javascript
// Rule 1: Critical to Senior
{
  "name": "Senior for Critical",
  "priority": 100,
  "conditions": {
    "priority": ["critical"]
  },
  "assignmentType": "specific_user",
  "targetUserId": "senior-tech-id"
}

// Rule 2: Others round-robin
{
  "name": "Round Robin for Others",
  "priority": 50,
  "conditions": {},
  "assignmentType": "round_robin",
  "targetUserIds": ["tech1", "tech2", "tech3"]
}
```

---

### Use Case 2: Department-Based Assignment

**Goal:** IT tickets to IT team, HR tickets to HR team

```javascript
{
  "name": "IT Department Assignment",
  "conditions": {
    "keywords": ["computer", "network", "printer", "software"],
    "department": ["IT"]
  },
  "assignmentType": "least_busy",
  "targetUserIds": ["it-tech-1", "it-tech-2"]
}
```

---

### Use Case 3: Escalation Workflow

**Goal:** Escalate unresolved high-priority tickets after 12 hours

```javascript
{
  "name": "Escalate Old High Priority",
  "trigger": "updated",
  "conditions": [
    {
      "field": "priority",
      "operator": "equals",
      "value": "high"
    },
    {
      "field": "status",
      "operator": "not_equals",
      "value": "resolved"
    }
  ],
  "actions": [
    {
      "type": "change_priority",
      "params": { "priority": "critical" }
    },
    {
      "type": "send_notification",
      "params": {
        "message": "High priority ticket escalated to critical",
        "recipients": ["manager-id"]
      }
    }
  ]
}
```

---

### Use Case 4: Auto-Close Old Resolved Tickets

**Goal:** Close tickets that have been resolved for 48 hours

```javascript
{
  "name": "Auto-Close Resolved Tickets",
  "trigger": "updated",
  "conditions": [
    {
      "field": "status",
      "operator": "equals",
      "value": "resolved"
    }
  ],
  "actions": [
    {
      "type": "change_status",
      "params": { "status": "closed" }
    },
    {
      "type": "add_comment",
      "params": {
        "comment": "Ticket automatically closed after resolution. Reopen if you need further assistance."
      }
    }
  ]
}
```

---

## 🎨 Condition Operators Explained

### Available Operators

| Operator | Example | Description |
|----------|---------|-------------|
| `equals` | `priority = "high"` | Exact match |
| `not_equals` | `status != "closed"` | Not equal |
| `contains` | `title contains "printer"` | Text contains substring |
| `not_contains` | `description not contains "resolved"` | Text doesn't contain |
| `greater_than` | `age > 24` | Number comparison |
| `less_than` | `priority_score < 5` | Number comparison |
| `in` | `status in ["open", "in_progress"]` | One of values |
| `not_in` | `priority not in ["low"]` | None of values |

---

## 📈 Monitoring & Maintenance

### Daily Checks
```bash
# Check SLA compliance
curl http://localhost:4000/api/workflows/sla-stats

# Check assignment distribution
curl http://localhost:4000/api/workflows/assignment-stats

# Check recent workflow executions
curl http://localhost:4000/api/workflows/executions?limit=10
```

### Weekly Reviews
1. Review SLA breach reports
2. Adjust time limits if needed
3. Check technician workload balance
4. Review and update workflows

### Monthly Optimization
1. Analyze workflow execution patterns
2. Remove unused workflows
3. Update assignment rules based on team changes
4. Review and optimize SLA policies

---

## 🐛 Troubleshooting

### Workflow Not Triggering?
1. Check if workflow is active
2. Verify conditions are correct
3. Check workflow execution logs
4. Ensure trigger matches the event

### Ticket Not Auto-Assigned?
1. Check if any assignment rules exist
2. Verify rule conditions match
3. Ensure technicians are available
4. Check assignment stats

### SLA Not Created?
1. Verify SLA policy exists for that priority
2. Check if policy is active
3. Look for errors in server logs

---

## 💡 Best Practices

### 1. Start Simple
- Begin with 1 SLA policy
- Add 1 basic assignment rule
- Create 1-2 simple workflows
- Test thoroughly before adding more

### 2. Use Priorities
- Higher priority workflows run first
- Use priorities to control execution order
- Range: 0 (low) to 1000 (high)

### 3. Test Before Activating
- Create workflows as inactive
- Test with sample tickets
- Review execution logs
- Activate when confident

### 4. Monitor Regularly
- Check SLA stats daily
- Review workflow executions
- Adjust based on patterns
- Keep workflows updated

### 5. Document Your Rules
- Add clear descriptions
- Explain why each rule exists
- Document expected behavior
- Train team on automation

---

## 🎓 Learning Path

### Week 1: SLA Basics
- Create SLA policies for each priority
- Monitor compliance rates
- Adjust time limits as needed

### Week 2: Auto-Assignment
- Set up basic assignment rules
- Monitor workload distribution
- Refine rules based on results

### Week 3: Simple Workflows
- Auto-comments on ticket creation
- Status change notifications
- Basic escalation rules

### Week 4: Advanced Automation
- Complex condition workflows
- Multi-action workflows
- Integration with WhatsApp

---

## 📞 Need Help?

Check these resources:
1. **WORKFLOW_SYSTEM_EXPLAINED.md** - Detailed explanations
2. **WORKFLOW_AUTOMATION_COMPLETE.md** - Technical documentation
3. **Server logs** - Real-time execution details
4. **API responses** - Detailed error messages

---

**Ready to automate? Start with Step 1 above! 🚀**

**Remember:** The system logs everything, so you can always review what happened and why.
