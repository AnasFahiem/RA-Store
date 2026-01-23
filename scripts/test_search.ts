
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { searchProducts } from '../lib/actions/products';

async function test() {
    console.log("Testing searchProducts...");
    const query = "Play";
    console.log(`Query: "${query}"`);

    try {
        const results = await searchProducts(query);
        console.log("Results id/name:", results.map(r => ({ id: r.id, name: r.name })));
        console.log("Total results:", results.length);
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
