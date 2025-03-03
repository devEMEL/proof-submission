const {zkVerifySession, ZkVerifyEvents} = require("zkverifyjs");

const fs = require("fs");
const proof = require("./proof.json"); // Following the Risc Zero tutorial

const main = async() => {


    const session = await zkVerifySession.start().Testnet().withAccount("your-zkverify-seed-phrase");
    const {events, txResults} = await session.verify().risc0().waitForPublishedAttestation()
    .execute({proofData:{
        proof: proof.proof,
        vk: proof.image_id,
        publicSignals: proof.pub_inputs,
        version: "V1_2" // Mention the R0 version
    }});

    let txHash;
    let blockHash;
    events.on(ZkVerifyEvents.IncludedInBlock, (eventData) => {
        txHash = eventData.txHash;
        blockHash = eventData.blockHash;
        console.log('Transaction included in block:', eventData);
    });

    let leafDigest; // This is required for session.poe() call
    events.on(ZkVerifyEvents.Finalized, (eventData) => {
        leafDigest = eventData.leafDigest;
        console.log('Transaction finalized:', eventData);
    });

    events.on(ZkVerifyEvents.AttestationConfirmed, async(eventData) => {
        console.log('Attestation Confirmed', eventData);
        // eventData.id is the attestationId contained within ZkVerifyEvents.AttestationConfirmed
        // leafDigest is obtained from ZkVerifyEvents.Finalized
        const proofDetails = await session.poe(eventData.id, leafDigest);
        fs.writeFileSync("attestation.json", JSON.stringify(proofDetails, null, 2));
        console.log("proofDetails", proofDetails);
        process.exit(0);
    });
};

main().then().catch(err => console.log(err));

