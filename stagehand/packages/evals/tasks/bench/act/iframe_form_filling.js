import { defineBenchTask } from "../../../framework/defineTask.js";
export default defineBenchTask({ name: "iframe_form_filling" }, async ({ debugUrl, sessionUrl, v3, logger }) => {
    try {
        const page = v3.context.pages()[0];
        await page.goto("https://browserbase.github.io/stagehand-eval-sites/sites/iframe-form-filling/");
        await v3.act("type 'nunya' into the 'first name' field");
        await v3.act("type 'business' into the 'last name' field");
        await v3.act("type 'test@email.com' into the 'email' field");
        await v3.act("click 'phone' as the preferred contact method");
        await v3.act("type 'yooooooooooooooo' into the message box");
        const iframe = page.frameLocator("iframe");
        const firstNameValue = await iframe
            .locator('input[placeholder="Jane"]')
            .inputValue();
        const lastNameValue = await iframe
            .locator('input[placeholder="Doe"]')
            .inputValue();
        const emailValue = await iframe
            .locator('input[placeholder="jane@example.com"]')
            .inputValue();
        const contactValue = await iframe
            .locator("xpath=/html/body/main/section[1]/form/fieldset/label[2]/input")
            .isChecked();
        const messageValue = await iframe
            .locator('textarea[placeholder="Say hello…"]')
            .inputValue();
        const passed = firstNameValue.toLowerCase().trim() === "nunya" &&
            lastNameValue.toLowerCase().trim() === "business" &&
            emailValue.toLowerCase() === "test@email.com" &&
            messageValue.toLowerCase() === "yooooooooooooooo" &&
            contactValue;
        return {
            _success: passed,
            logs: logger.getLogs(),
            debugUrl,
            sessionUrl,
        };
    }
    catch (error) {
        return {
            _success: false,
            error: error,
            logs: logger.getLogs(),
            debugUrl,
            sessionUrl,
        };
    }
    finally {
        await v3.close();
    }
});
