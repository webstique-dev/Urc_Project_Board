import mongoose from "mongoose";
import dotenv from "dotenv";
import Board from "../models/Board.js";
import List from "../models/List.js";
import Card from "../models/Card.js";
import User from "../models/User.js";

dotenv.config();

const CONSTRUCTION_TASKS_TEMPLATE = {
  todo: [
    {
      title: "HVAC Ductwork & Ventilation Routing",
      description: "Coordinate mechanical subcontractor routing through levels 2-4 according to the latest 3D MEP clash detection models.",
      labels: ["Planning", "Procurement"],
      priority: "medium",
      dueDaysOffset: 14,
      completed: false,
      checklist: [
        { text: "Subcontractor site briefing & safety clearance", done: false },
        { text: "Verify ductwork dimensions against ceiling heights", done: false },
        { text: "Inspect delivered dampers & fire collars", done: false },
        { text: "Schedule mobile crane lift for rooftop chillers", done: false },
      ],
    },
    {
      title: "Fire Protection Sprinkler Rough-In (Zone B)",
      description: "Install main riser valves, branch distribution piping, and pendent sprinkler heads across Zone B retail area.",
      labels: ["Safety", "Plumbing"],
      priority: "high",
      dueDaysOffset: 9,
      completed: false,
      checklist: [
        { text: "Review NFPA 13 sprinkler spacing layout", done: false },
        { text: "Pressure test main riser pipe joint assemblies", done: false },
        { text: "Coordinate ceiling drop heights with drywall team", done: false },
        { text: "Verify seismic sway braces installation", done: false },
      ],
    },
    {
      title: "Procure Grade 60 Rebar & Structural Steel Fasteners",
      description: "Issue purchase order for 45 metric tons of deformed reinforcement steel bar (ASTM A615) and high-strength anchor bolts.",
      labels: ["Procurement", "Structural"],
      priority: "medium",
      dueDaysOffset: 18,
      completed: false,
      checklist: [
        { text: "Obtain mill test certificates from steel fabricator", done: false },
        { text: "Verify ASTM tensile compliance and chemical composition", done: false },
        { text: "Approve freight delivery schedule to job site", done: false },
        { text: "Designate on-site laydown yard staging area", done: false },
      ],
    },
    {
      title: "Perimeter Excavation & Shoring Wall Stabilization",
      description: "Execute soldier pile drilling and wood lagging installation along north retaining perimeter to prevent slope displacement.",
      labels: ["Site Work", "Safety"],
      priority: "high",
      dueDaysOffset: 6,
      completed: false,
      checklist: [
        { text: "Conduct utility locate & mark 811 verification", done: false },
        { text: "Drive soldier beams to refusal depth", done: false },
        { text: "Install tieback anchors and proof-test tension", done: false },
        { text: "Daily geotechnical laser survey monitoring", done: false },
      ],
    },
  ],
  inProgress: [
    {
      title: "Pouring Concrete Slab for Level 3 Suspended Floor",
      description: "Pour 350 m³ of 40 MPa fiber-reinforced ready-mix concrete with continuous slump testing and vibration consolidation.",
      labels: ["Structural", "Site Work"],
      priority: "high",
      dueDaysOffset: 3,
      completed: false,
      checklist: [
        { text: "Formwork scaffolding leveling check", done: true },
        { text: "Rebar spacing and chair clearance inspection", done: true },
        { text: "Continuous slump and cylinder compression sampling", done: true },
        { text: "Power trowel finishing and curing compound application", done: false },
      ],
    },
    {
      title: "Main Switchgear & Electrical Conduit Distribution",
      description: "Pull 480V feeder cables from central electrical room through underground conduits to primary panels.",
      labels: ["Electrical", "Safety"],
      priority: "high",
      dueDaysOffset: 5,
      completed: false,
      checklist: [
        { text: "Install NEMA-3R heavy-duty switchboard housing", done: true },
        { text: "Pull 500kcmil copper THHN wiring through conduits", done: true },
        { text: "Perform insulation resistance megger testing", done: false },
        { text: "Label circuit breaker panels per single-line diagram", done: false },
      ],
    },
    {
      title: "Sanitary Drainage & Stormwater Infiltration Piping",
      description: "Lay PVC schedule 40 gravity sewer lines and tie into the municipal stormwater detention vault.",
      labels: ["Plumbing", "Site Work"],
      priority: "medium",
      dueDaysOffset: 7,
      completed: false,
      checklist: [
        { text: "Trench bedding laser grading to 1.5% fall", done: true },
        { text: "Install cleanouts and backwater check valves", done: true },
        { text: "Perform 10-foot water column static head test", done: false },
        { text: "Backfill with compacted aggregate in 6-inch lifts", done: false },
      ],
    },
  ],
  review: [
    {
      title: "Pre-Pour Foundation Rebar & Formwork Inspection",
      description: "Third-party structural engineer inspection of foundation reinforcement layout, lap splices, and anchor embeds.",
      labels: ["Inspection", "Structural"],
      priority: "high",
      dueDaysOffset: 1,
      completed: false,
      checklist: [
        { text: "Verify rebar lap splices & tie wire frequency", done: true },
        { text: "Check vapor barrier seal integrity", done: true },
        { text: "Confirm anchor bolt template alignment with laser", done: true },
        { text: "Sign off official structural engineer permit certificate", done: false },
      ],
    },
    {
      title: "Weekly Site Safety & OSHA Compliance Audit",
      description: "Job-site safety walkthrough covering fall protection, PPE adherence, scaffolding tags, and hazardous material storage.",
      labels: ["Safety", "Inspection"],
      priority: "medium",
      dueDaysOffset: 2,
      completed: false,
      checklist: [
        { text: "Inspect harnesses, lanyards, and static safety lines", done: true },
        { text: "Verify GFCI electrical protection on all temporary power", done: true },
        { text: "Audit first aid station supplies & eyewash units", done: true },
        { text: "Submit OSHA weekly compliance log to general contractor", done: false },
      ],
    },
    {
      title: "Architectural BIM Clash Detection Review",
      description: "Review Navisworks federated model clashes between structural steel beams, plumbing stacks, and cable trays.",
      labels: ["Planning", "Inspection"],
      priority: "low",
      dueDaysOffset: 4,
      completed: false,
      checklist: [
        { text: "Run Navisworks hard clash batch test", done: true },
        { text: "Resolve clearance conflict at Core Wall #2", done: true },
        { text: "Issue revised RFI to MEP consultant engineer", done: true },
        { text: "Publish federated coordination model v4.2", done: false },
      ],
    },
  ],
  done: [
    {
      title: "Geotechnical Soil Boring & Bearing Capacity Report",
      description: "Completed 6 deep core boreholes and verified 250 kPa allowable soil bearing capacity for foundation engineering.",
      labels: ["Site Work", "Planning"],
      priority: "medium",
      dueDaysOffset: -5,
      completed: true,
      checklist: [
        { text: "Drill 6 exploratory boreholes to 45 ft depth", done: true },
        { text: "Laboratory sieve analysis and Atterberg limits", done: true },
        { text: "Standard Penetration Test (SPT) blow counts log", done: true },
        { text: "Final certified geotechnical engineering report", done: true },
      ],
    },
    {
      title: "City Zoning & Environmental Building Permit Approval",
      description: "Received approved master building permit and EPA storm water pollution prevention plan (SWPPP) approval.",
      labels: ["Planning", "Inspection"],
      priority: "high",
      dueDaysOffset: -10,
      completed: true,
      checklist: [
        { text: "Submit architectural drawings to Dept of Buildings", done: true },
        { text: "Erosion and sediment control plan approval", done: true },
        { text: "Pay municipal development impact fees", done: true },
        { text: "Display stamped building permit at site entrance", done: true },
      ],
    },
    {
      title: "Site Clearing, Grubbing & Temporary Utility Hookups",
      description: "Cleared construction perimeter, installed 8ft security fencing, temporary power drop, and water meters.",
      labels: ["Site Work", "Electrical"],
      priority: "low",
      dueDaysOffset: -12,
      completed: true,
      checklist: [
        { text: "Erect 8ft galvanized perimeter chain-link fence", done: true },
        { text: "Install temporary 200A construction power pole", done: true },
        { text: "Set up job site field trailers and satellite internet", done: true },
        { text: "Establish designated crane assembly and wash-down bay", done: true },
      ],
    },
  ],
};

function getDueDate(offsetDays) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  date.setHours(17, 0, 0, 0);
  return date;
}

async function seedBoard(board) {
  console.log(`\nProcessing Board: "${board.title}" (${board._id})`);

  // Extract existing members on the board
  const memberIds = (board.members || [])
    .map((m) => (m.user?._id ? m.user._id : m.user))
    .filter(Boolean);

  console.log(`  Existing members count: ${memberIds.length}`);

  // Fetch lists for this board
  const lists = await List.find({ board: board._id }).sort({ order: 1 });
  if (lists.length === 0) {
    console.log("  No lists found for this board. Skipping.");
    return;
  }

  // Map standard list titles
  const findList = (candidates) =>
    lists.find((l) =>
      candidates.some((c) => l.title.trim().toLowerCase() === c.toLowerCase())
    );

  const todoList = findList(["To Do", "Todo", "Backlog", "Planned"]) || lists[0];
  const inProgressList =
    findList(["In Progress", "Doing", "Active", "WIP"]) || lists[Math.min(1, lists.length - 1)];
  const reviewList =
    findList(["Review", "Testing", "QA", "Inspection"]) || lists[Math.min(2, lists.length - 1)];
  const doneList =
    findList(["Done", "Completed", "Finished"]) || lists[lists.length - 1];

  const listMapping = [
    { targetList: todoList, templates: CONSTRUCTION_TASKS_TEMPLATE.todo },
    { targetList: inProgressList, templates: CONSTRUCTION_TASKS_TEMPLATE.inProgress },
    { targetList: reviewList, templates: CONSTRUCTION_TASKS_TEMPLATE.review },
    { targetList: doneList, templates: CONSTRUCTION_TASKS_TEMPLATE.done },
  ];

  let memberIndex = 0;

  for (const { targetList, templates } of listMapping) {
    if (!targetList) continue;

    // Count existing cards in this list to establish sequential order
    const existingCards = await Card.find({ list: targetList._id }).sort({ order: 1 });
    let currentOrder = existingCards.length > 0 ? existingCards[existingCards.length - 1].order + 1 : 0;

    for (const t of templates) {
      // Avoid duplicate insertion if card with this title already exists on this board
      const alreadyExists = await Card.findOne({
        board: board._id,
        title: t.title,
      });

      if (alreadyExists) {
        console.log(`  - Card "${t.title}" already exists on this board. Skipping duplicate.`);
        continue;
      }

      // Assign tasks strictly to existing project members on this board
      let assignees = [];
      if (memberIds.length > 0) {
        // Assign 1 or 2 members per task
        const firstAssignee = memberIds[memberIndex % memberIds.length];
        assignees.push(firstAssignee);
        if (memberIds.length > 1 && memberIndex % 2 === 1) {
          const secondAssignee = memberIds[(memberIndex + 1) % memberIds.length];
          if (!assignees.includes(secondAssignee)) {
            assignees.push(secondAssignee);
          }
        }
        memberIndex++;
      }

      const checklistItems = t.checklist.map((item) => ({
        text: item.text,
        done: item.done,
      }));

      const newCard = await Card.create({
        title: t.title,
        description: t.description,
        board: board._id,
        list: targetList._id,
        order: currentOrder++,
        completed: t.completed,
        priority: t.priority,
        labels: t.labels,
        dueDate: getDueDate(t.dueDaysOffset),
        assignees,
        checklist: checklistItems,
        checklistTitle: "Deliverables & Verification",
        checklists: [
          {
            title: "Deliverables & Verification",
            items: checklistItems,
          },
        ],
        createdBy: memberIds[0] || board.createdBy,
      });

      console.log(`  + Created card: "${newCard.title}" in list "${targetList.title}" (assigned to ${assignees.length} member(s))`);
    }
  }
}

async function runSeed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB database.");

    const boards = await Board.find({ archived: false }).populate("members.user", "name email");
    console.log(`Found ${boards.length} active board(s).`);

    for (const board of boards) {
      await seedBoard(board);
    }

    console.log("\nConstruction dummy data seeding completed successfully!");
  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

runSeed();
