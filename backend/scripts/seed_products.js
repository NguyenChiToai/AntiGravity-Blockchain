const hre = require("hardhat");

async function main() {
    const CONTRACT_ADDRESS = "0x0165878A594ca255338adfa4d48449f69242Eb8F";
    const RiceTracking = await hre.ethers.getContractFactory("RiceTracking");
    const contract = RiceTracking.attach(CONTRACT_ADDRESS);

    // Ảnh placeholder icon lúa nhỏ để tránh lỗi gas khi seed bằng script (Backend ko resize được)
    // Trong thực tế, UI sẽ resize ảnh xịn của User. 
    // Ở đây ta dùng icon base64 tượng trưng để hệ thống có data demo.
    const riceIconBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAABCFBMVEX////+/v78/Pz5+fn29vbz8/Py8vLx8fHw8PDv7+/u7u7t7e3s7Ozn5+fk5OTi4uLh4eHg4ODf39/e3t7d3d3c3Nzb29vX19fV1dXT09PR0dHQ0NDPz8/MzMzLy8vKysrJycnHx8fGxsbFxcXExMTDw8PCwsLAwMD/2Yf/2Ij/2on/24r/3Iv/3Y3/3o7/34//4JD/4ZH/4pL/45P/5JT/5ZX/5pb/55f/6Jj/6Zn/6pr/65v/7Jz/7Z3/7p7/75//8KD/8aH/8qL/86P/9KT/9aX/9qb/96f/+Kj/+an/+qr/+6v//Kz//a3//q7//6///7D///D///H///P///T///X///f///r///z///7///8W8xWXAAAAWHRSTlMAAgMEBQYHCAkKCwwNDg8QERITFBUWFxgZGhscHR4fICEiIyQlJicpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWl19b8IAAAABYktHRACIBR1IAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gIEFAk1r0uT4gAAAMVJREFUOMu9k0sWwiAQRLsVf6j4iI+o7P9aKkSMJpI2605mEgZmOQD+g20bBwB+QGscQ88zOA6de/8GqN6uFqQ1e0DPhx4kPf8CiA7sQZ7HDiQ5dwcoz+0B87Qd4CttB/hK2wG+0naAr7Qd4CttB/hKywHyuR0gn9sB8rnt/4B87v9AfrkD5Jc7QH65A+SXO0B+uQPklz1Afd4D1Oc9QH3eA9TnPUAe2wPy2B6Qx/aAPLYH5LE9II/tAXlsD8hje0Ae2wPy2B6Qx/aAPLY/P+52Fh+0+3MAAAAldEVYdGRhdGU6Y3JlYXRlADIwMjYtMDItMDRUMjE6NDU6MDkrMDc6MDAB+iOAAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDI2LTAyLTA0VDIxOjQ1OjA5KzA3OjAwS90d6AAAAABJRU5ErkJggg==";

    console.log("Đang tạo dữ liệu mẫu...");

    // 1. Tạo ST25
    console.log("Creating ST25...");
    const tx1 = await contract.createPaddyBatch(
        "ST25 (Gạo Ông Cua)",
        "Sóc Trăng",
        true, // Organic
        riceIconBase64,
        { gasLimit: 5000000 }
    );
    await tx1.wait();
    console.log("✅ Created ST25");

    // 2. Tạo ST24
    console.log("Creating ST24...");
    const tx2 = await contract.createPaddyBatch(
        "ST24 (Gạo Thơm)",
        "Bạc Liêu",
        false, // Non-organic
        riceIconBase64,
        { gasLimit: 5000000 }
    );
    await tx2.wait();
    console.log("✅ Created ST24");

    console.log("Hoàn tất seed data!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
