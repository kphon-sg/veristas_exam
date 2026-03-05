
async function test() {
  const quizData = {
    title: "Automated Test Quiz",
    duration: 20,
    classId: 1,
    teacherId: 1,
    deadline: "2026-12-31T23:59:59Z",
    status: "PUBLISHED",
    questions: [
      {
        text: "What is 1+1?",
        type: "MULTIPLE_CHOICE",
        options: ["1", "2", "3"],
        correctAnswer: 1,
        points: 1
      }
    ]
  };

  console.log("Sending POST /api/quizzes...");
  const res = await fetch("http://localhost:3000/api/quizzes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(quizData)
  });

  if (res.ok) {
    const data = await res.json();
    console.log("Success! Created quiz ID:", data.id);
    
    console.log("Verifying via GET /api/quizzes...");
    const getRes = await fetch("http://localhost:3000/api/quizzes?teacherId=1");
    const quizzes = await getRes.json();
    const found = quizzes.find((q: any) => q.title === "Automated Test Quiz");
    if (found) {
      console.log("Verification SUCCESS: Quiz found in GET response.");
    } else {
      console.log("Verification FAILED: Quiz NOT found in GET response.");
    }
  } else {
    console.log("POST failed:", res.status, await res.text());
  }
}

test();
