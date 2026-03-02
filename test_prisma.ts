import { evaluationService } from "./src/services/evaluationService";
async function run() {
    try {
        console.log("running test...");
        const res = await evaluationService.getSubmissionsByAttempt("non-existent");
        console.log("Success:", res);
    } catch (e) {
        console.error("Error:", e);
    }
}
run();
