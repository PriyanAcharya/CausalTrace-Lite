const request = "Book a table for two at an Italian restaurant tonight at 7 PM.";

const expectedUnderstand = { cuisine: "Italian", date: "tonight", time: "7 PM", partySize: 2 };
const expectedChoose = {
  restaurantId: "r-italian-01",
  cuisine: "Italian",
  date: "tonight",
  time: "7 PM",
  partySize: 2,
};
const expectedExecute = {
  restaurantId: "r-italian-01",
  date: "tonight",
  time: "7 PM",
  partySize: 2,
};

export const DEFAULT_SCENARIO_ID = "misunderstood-request";

export const scenarios = [
  {
    id: "misunderstood-request",
    title: "The Misunderstood Request",
    shortTitle: "Misunderstood request",
    description: "The agent turns “tonight” into tomorrow, then carries that date through the booking.",
    request,
    outcome: "Booking attempted for tomorrow at 7 PM.",
    rootExplanation: "Understand changed the requested date. Choose and Execute preserve that incorrect date, so the final attempt is already off course.",
    naiveExplanation: "A last-error-only debugger blames the final attempt for tomorrow. That explains the bad action, but misses that Understand introduced the wrong date.",
    causalDependencies: [
      { fromStage: "understand", fromField: "date", toStage: "choose", toField: "date" },
      { fromStage: "choose", fromField: "date", toStage: "execute", toField: "date" },
    ],
    stages: [
      {
        id: "understand",
        name: "UNDERSTAND",
        input: { request },
        expectedOutput: expectedUnderstand,
        expectedForInput: expectedUnderstand,
        actualOutput: { cuisine: "Italian", date: "tomorrow", time: "7 PM", partySize: 2 },
        summary: "“Tonight” was interpreted as tomorrow evening.",
        event: "Parsed the requested date as tomorrow.",
      },
      {
        id: "choose",
        name: "CHOOSE",
        input: { cuisine: "Italian", date: "tomorrow", time: "7 PM", partySize: 2 },
        expectedOutput: expectedChoose,
        expectedForInput: { ...expectedChoose, date: "tomorrow" },
        actualOutput: { ...expectedChoose, date: "tomorrow" },
        summary: "A suitable Italian restaurant was chosen for the date it received.",
        event: "Selected an Italian restaurant for tomorrow at 7 PM.",
      },
      {
        id: "execute",
        name: "EXECUTE",
        input: { ...expectedChoose, date: "tomorrow" },
        expectedOutput: expectedExecute,
        expectedForInput: { ...expectedExecute, date: "tomorrow" },
        actualOutput: { ...expectedExecute, date: "tomorrow" },
        summary: "The booking attempt used the date passed forward from Understand.",
        event: "Attempted to submit the booking for tomorrow at 7 PM.",
      },
    ],
  },
  {
    id: "wrong-restaurant",
    title: "The Wrong Restaurant",
    shortTitle: "Wrong restaurant",
    description: "The request is understood, but the agent chooses a Chinese restaurant instead of an Italian one.",
    request,
    outcome: "Booking submitted for a Chinese restaurant.",
    rootExplanation: "Choose selected a restaurant that violates the Italian cuisine requirement. Execute carries out that choice, so its final submission is a symptom.",
    naiveExplanation: "A last-error-only debugger blames the final submission to the Chinese restaurant. The first incorrect decision happened earlier, when Choose selected it.",
    causalDependencies: [
      { fromStage: "choose", fromField: "restaurantId", toStage: "execute", toField: "restaurantId" },
      { fromStage: "choose", fromField: "cuisine", toStage: "execute", toField: "cuisine" },
    ],
    stages: [
      {
        id: "understand",
        name: "UNDERSTAND",
        input: { request },
        expectedOutput: expectedUnderstand,
        expectedForInput: expectedUnderstand,
        actualOutput: { ...expectedUnderstand },
        summary: "Cuisine, date, time, and party size were extracted correctly.",
        event: "Parsed Italian, tonight at 7 PM, for two.",
      },
      {
        id: "choose",
        name: "CHOOSE",
        input: { ...expectedUnderstand },
        expectedOutput: expectedChoose,
        expectedForInput: expectedChoose,
        actualOutput: {
          restaurantId: "r-chinese-02",
          cuisine: "Chinese",
          date: "tonight",
          time: "7 PM",
          partySize: 2,
        },
        summary: "A Chinese restaurant was selected despite the Italian requirement.",
        event: "Selected a Chinese restaurant for tonight at 7 PM.",
      },
      {
        id: "execute",
        name: "EXECUTE",
        input: {
          restaurantId: "r-chinese-02",
          cuisine: "Chinese",
          date: "tonight",
          time: "7 PM",
          partySize: 2,
        },
        expectedOutput: expectedExecute,
        expectedForInput: {
          restaurantId: "r-chinese-02",
          date: "tonight",
          time: "7 PM",
          partySize: 2,
        },
        actualOutput: {
          restaurantId: "r-chinese-02",
          cuisine: "Chinese",
          date: "tonight",
          time: "7 PM",
          partySize: 2,
        },
        summary: "The booking was successfully submitted for the selected restaurant.",
        event: "Submitted a booking for the selected Chinese restaurant.",
      },
    ],
  },
  {
    id: "booking-failed",
    title: "The Booking That Failed",
    shortTitle: "Booking failed",
    description: "The request and restaurant choice are correct, but Execute submits the wrong party size.",
    request,
    outcome: "Booking request submitted for four people instead of two.",
    rootExplanation: "Execute sent a party size of four, contradicting the request for two. The earlier stages are correct and there is no later stage to blame.",
    naiveExplanation: "The naive diagnosis also blames Execute's final action. In this trace that is the root cause, so both methods identify the same stage.",
    causalDependencies: [],
    stages: [
      {
        id: "understand",
        name: "UNDERSTAND",
        input: { request },
        expectedOutput: expectedUnderstand,
        expectedForInput: expectedUnderstand,
        actualOutput: { ...expectedUnderstand },
        summary: "Cuisine, date, time, and party size were extracted correctly.",
        event: "Parsed Italian, tonight at 7 PM, for two.",
      },
      {
        id: "choose",
        name: "CHOOSE",
        input: { ...expectedUnderstand },
        expectedOutput: expectedChoose,
        expectedForInput: expectedChoose,
        actualOutput: { ...expectedChoose },
        summary: "A suitable Italian restaurant was selected.",
        event: "Selected an Italian restaurant for two tonight at 7 PM.",
      },
      {
        id: "execute",
        name: "EXECUTE",
        input: { ...expectedChoose },
        expectedOutput: expectedExecute,
        expectedForInput: expectedExecute,
        actualOutput: { ...expectedExecute, partySize: 4 },
        summary: "The submitted booking used a party size of four.",
        event: "Submitted the booking for four people.",
      },
    ],
  },
];

export function getScenario(id) {
  return scenarios.find((scenario) => scenario.id === id) ?? null;
}
