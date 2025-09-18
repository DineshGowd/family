# Step-by-Step Debugging Guide

## Problem
Child relationships are not working when created through the UI forms.

## Debugging Steps

### Step 1: Clear Database and Create People
1. Run `npm run db:seed` to clear database
2. Add Ram, Sita, and Lava through the UI
3. Verify all 3 people exist in Grid View

### Step 2: Test Direct API Calls
Copy this into browser console (F12):
```javascript
// Test direct API relationship creation
async function testDirectAPI() {
  const people = await fetch('/api/people').then(r => r.json())
  const ram = people.find(p => p.firstName.toLowerCase() === 'ram')
  const lava = people.find(p => p.firstName.toLowerCase() === 'lava')
  
  console.log('Testing direct API call...')
  console.log('Ram ID:', ram.id)
  console.log('Lava ID:', lava.id)
  
  const response = await fetch('/api/relationships', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      parentId: ram.id,
      childId: lava.id
    })
  })
  
  if (response.ok) {
    console.log('✅ Direct API call successful')
    const result = await response.json()
    console.log('Result:', result)
  } else {
    console.log('❌ Direct API call failed')
    const error = await response.json()
    console.log('Error:', error)
  }
}
testDirectAPI()
```

### Step 3: Test UI Form (if Step 2 works)
1. Edit Ram's profile
2. Open browser console (F12) 
3. In "Children" section, select "Lava"
4. Click the add button
5. Watch console logs for:
   - "🔍 RelationshipManager received person: Ram [ID]"
   - "🎯 Child selected: [lava-id] Lava"
   - "Adding child relationship: Parent: Ram, Child: [lava-id]"
   - "Sending relationship data to API: {parentId: [ram-id], childId: [lava-id]}"

### Step 4: Check What Actually Gets Created
After attempting to create the relationship:
```javascript
// Check what relationships exist
fetch('/api/people').then(r => r.json()).then(people => {
  const ram = people.find(p => p.firstName.toLowerCase() === 'ram')
  const lava = people.find(p => p.firstName.toLowerCase() === 'lava')
  
  console.log('Ram children:', ram.childRelations.map(r => r.child.firstName))
  console.log('Lava parents:', lava.parentRelations.map(r => r.parent.firstName))
})
```

## Expected Results

### If Step 2 (Direct API) Works:
- Problem is in the UI form handling
- Check RelationshipManager component
- Check PersonModal data passing

### If Step 2 (Direct API) Fails:
- Problem is in the API or database
- Check relationships API route
- Check database schema

### If Step 3 (UI Form) Shows Wrong IDs:
- Problem is in person data or dropdown selection
- Check PersonModal currentPerson calculation
- Check dropdown value handling

### If Step 4 Shows Wrong Relationships:
- Check for the bug where Ram becomes parent of Ram
- Use cleanup script to remove incorrect relationships

## Common Issues to Look For

1. **Wrong Person ID**: RelationshipManager receives wrong person
2. **Stale Data**: PersonModal uses outdated person data  
3. **Dropdown Bug**: Selected child ID is wrong
4. **API Bug**: Wrong data sent to API
5. **Database Bug**: Relationship created with wrong IDs
6. **UI Refresh Bug**: Relationship created but UI doesn't update

## Fix Approach

1. **Identify the exact step where it fails**
2. **Fix that specific component/function**
3. **Test the fix with the same steps**
4. **Verify tree view displays correctly**