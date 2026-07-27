"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileForm = void 0;
const Form_1 = require("components/ResumeForm/Form");
const InputGroup_1 = require("components/ResumeForm/Form/InputGroup");
const hooks_1 = require("lib/redux/hooks");
const resumeSlice_1 = require("lib/redux/resumeSlice");
const ProfileForm = () => {
    const profile = (0, hooks_1.useAppSelector)(resumeSlice_1.selectProfile);
    const dispatch = (0, hooks_1.useAppDispatch)();
    const { name, email, phone, url, summary, location } = profile;
    const handleProfileChange = (field, value) => {
        dispatch((0, resumeSlice_1.changeProfile)({ field, value }));
    };
    return (<Form_1.BaseForm>
      <div className="grid grid-cols-6 gap-3">
        <InputGroup_1.Input label="Name" labelClassName="col-span-full" name="name" placeholder="Sal Khan" value={name} onChange={handleProfileChange}/>
        <InputGroup_1.Textarea label="Objective" labelClassName="col-span-full" name="summary" placeholder="Entrepreneur and educator obsessed with making education free for anyone" value={summary} onChange={handleProfileChange}/>
        <InputGroup_1.Input label="Email" labelClassName="col-span-4" name="email" placeholder="hello@khanacademy.org" value={email} onChange={handleProfileChange}/>
        <InputGroup_1.Input label="Phone" labelClassName="col-span-2" name="phone" placeholder="(123)456-7890" value={phone} onChange={handleProfileChange}/>
        <InputGroup_1.Input label="Website" labelClassName="col-span-4" name="url" placeholder="linkedin.com/in/khanacademy" value={url} onChange={handleProfileChange}/>
        <InputGroup_1.Input label="Location" labelClassName="col-span-2" name="location" placeholder="NYC, NY" value={location} onChange={handleProfileChange}/>
      </div>
    </Form_1.BaseForm>);
};
exports.ProfileForm = ProfileForm;
