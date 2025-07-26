"use client";

import { useState, useEffect } from "react";
import { CTAButton } from "./CTAButton"; // Adjust the import path if necessary
import { basketTypeAndSizesInfo } from "./InformationConstants"; // Importing the pop-up information

interface DesignerQuestionnaireProps {
  onSubmit: (formData: any) => void;
}

const TOTAL_PAGES = 6;

const DesignerQuestionnaire: React.FC<DesignerQuestionnaireProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    projectName: "",
    projectAddress: "",
    projectLocation: "",
    plywoodThickness: "",
    blockBoardThickness: "",
    edgeBandingThicknessInner: "",
    edgeBandingThicknessColor: "",
    backPanelThickness: "",
    drawBottomThickness: "12mm", // Fixed value
    laminateCodes: "",
    handleType: "",
    profileLights: "",
    profileDoorBoxColor: "",
    basketTypeAndSizes: "",
    magicCornerDoorSize: "",
    skirtingSize: "",
    innerLayout: "",
    switchboardPlacement: "",
    falseCeilingStatus: "",
    civilWorkStatus: "",
    unitDepth: "",
    unitHeight: "",
    kitchenApplianceSizes: "",
    kitchenPlatformHeight: "",
    doorWidthInfo: "",
    panelWork: "",
    drawWidthInfo: "",
    designWorkDimensions: "",
    slidingDoorFramerequired: "",
    tvCrockeryBaseFixingMethod: "",
    hydraulicLiftUpType: "",
    topPanelType: "",
    wardrobeJointInfo: "",
    tallBoxType: "",
    tvCrockeryShoeRackTopMaterial: "",
    tandemSizes: "",
    name: "",
    phone: "",
  });

  const [page, setPage] = useState(1);
  const [progress, setProgress] = useState(0);
  const [showPopUp, setShowPopUp] = useState(false); // To control the visibility of the pop-up

  useEffect(() => {
    const savedData = localStorage.getItem("formData");
    if (savedData) {
      setFormData(JSON.parse(savedData));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("formData", JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    setProgress((page / TOTAL_PAGES) * 100);
  }, [page]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateContactDetails = () => {
    const { phone } = formData;
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (page === TOTAL_PAGES) {
      if (!validateContactDetails()) {
        alert("Please enter a valid email and phone number");
        return;
      }
      onSubmit(formData);
      localStorage.removeItem("formData");
    } else {
      setPage(page + 1);
    }
  };

  const handlePrevious = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleSkip = () => {
    setPage(page + 1);
  };

  const togglePopUp = () => {
    setShowPopUp((prev) => !prev);
  };

  return (
    <div className="flex justify-center items-center bg-gray-100">
      <div className="my-24 w-full max-w-xl p-6 bg-white rounded-lg shadow-md relative">
        <div className="flex flex-col justify-between items-center">
          <p className="text-lg">{`Step ${page} of ${TOTAL_PAGES}`}</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-theme-color h-2.5 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <h1 className="text-theme-color text-3xl md:text-5xl font-bold tracking-tight md:tracking-tighter leading-tight mb-10 mt-8 text-center">
          Project Details
        </h1>

        {showPopUp && (
          <div className="absolute top-0 left-0 w-full h-full bg-gray-800 bg-opacity-75 flex justify-center items-center z-10">
            <div className="bg-white p-6 rounded-lg shadow-lg w-2/3">
              <h2 className="text-lg font-bold mb-4">Basket Type and Sizes Information</h2>
              <table className="table-auto w-full">
                {basketTypeAndSizesInfo}
              </table>
              <button
                className="mt-4 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-700"
                onClick={togglePopUp}
              >
                Close
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Page 1 */}
          {page === 1 && (
            <>
              <div>
                <label className="block text-theme-secondary font-bold mb-2">Project Name</label>
                <input
                  type="text"
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-theme-primary"
                />
              </div>
              <div>
                <label className="block text-theme-secondary font-bold mb-2">Project Address</label>
                <input
                  type="text"
                  name="projectAddress"
                  value={formData.projectAddress}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-theme-primary"
                />
              </div>
              <div>
                <label className="block text-theme-secondary font-bold mb-2">Project Location</label>
                <input
                  type="text"
                  name="projectLocation"
                  value={formData.projectLocation}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-theme-primary"
                />
              </div>
            </>
          )}

          {/* Page 2 */}
          {page === 2 && (
            <>
              <div>
                <label className="block text-theme-secondary font-bold mb-2">Plywood Thickness</label>
                <select
                  name="plywoodThickness"
                  value={formData.plywoodThickness}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-theme-primary"
                >
                  <option value="">Select</option>
                  <option value="16mm">16 mm</option>
                  <option value="18mm">18 mm</option>
                  <option value="20mm">20 mm</option>
                  <option value="25mm">25 mm</option>
                </select>
              </div>
              <div>
                <label className="block text-theme-secondary font-bold mb-2">Block Board Thickness</label>
                <select
                  name="blockBoardThickness"
                  value={formData.blockBoardThickness}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-theme-primary"
                >
                  <option value="">Select</option>
                  <option value="16mm">16 mm</option>
                  <option value="18mm">18 mm</option>
                  <option value="20mm">20 mm</option>
                  <option value="25mm">25 mm</option>
                </select>
              </div>
              <div>
                <label className="block text-theme-secondary font-bold mb-2">Edge Banding Thickness - Inner</label>
                <input
                  type="text"
                  name="edgeBandingThicknessInner"
                  value={formData.edgeBandingThicknessInner}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-theme-primary"
                />
              </div>
              <div>
                <label className="block text-theme-secondary font-bold mb-2">Edge Banding Thickness - Color</label>
                <input
                  type="text"
                  name="edgeBandingThicknessColor"
                  value={formData.edgeBandingThicknessColor}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-theme-primary"
                />
              </div>
              <div>
                <label className="block text-theme-secondary font-bold mb-2">Back Panel Thickness</label>
                <select
                  name="backPanelThickness"
                  value={formData.backPanelThickness}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-theme-primary"
                >
                  <option value="">Select</option>
                  <option value="16mm">16 mm</option>
                  <option value="18mm">18 mm</option>
                  <option value="20mm">20 mm</option>
                  <option value="25mm">25 mm</option>
                </select>
              </div>
            </>
          )}

          {/* Page 3 */}
          {page === 3 && (
            <>
              <div>
                <label className="block text-theme-secondary font-bold mb-2">Laminate Codes</label>
                <input
                  type="text"
                  name="laminateCodes"
                  value={formData.laminateCodes}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-theme-primary"
                />
              </div>
              <div>
                <label className="block text-theme-secondary font-bold mb-2">Handle Type</label>
                <input
                  type="text"
                  name="handleType"
                  value={formData.handleType}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-theme-primary"
                />
              </div>
              <div>
                <label className="block text-theme-secondary font-bold mb-2">Profile Lights</label>
                <input
                  type="text"
                  name="profileLights"
                  value={formData.profileLights}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-theme-primary"
                />
              </div>
              <div>
                <label className="block text-theme-secondary font-bold mb-2">Profile Door Box Color</label>
                <input
                  type="text"
                  name="profileDoorBoxColor"
                  value={formData.profileDoorBoxColor}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-theme-primary"
                />
              </div>
              <div>
                <label className="block text-theme-secondary font-bold mb-2">Basket Type and Sizes</label>
                <input
                  type="text"
                  name="basketTypeAndSizes"
                  value={formData.basketTypeAndSizes}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-theme-primary"
                />
                <button
                  type="button"
                  className="mt-2 text-theme-color underline"
                  onClick={togglePopUp}
                >
                  View basket type and sizes info
                </button>
              </div>
            </>
          )}

          {/* Page 4 */}
          {page === 4 && (
            <>
              <div>
                <label className="block text-theme-secondary font-bold mb-2">Magic Corner Door Size</label>
                <input
                  type="text"
                  name="magicCornerDoorSize"
                  value={formData.magicCornerDoorSize}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-theme-primary"
                />
              </div>
              <div>
                <label className="block text-theme-secondary font-bold mb-2">Skirting Size</label>
                <input
                  type="text"
                  name="skirtingSize"
                  value={formData.skirtingSize}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-theme-primary"
                />
              </div>
              <div>
                <label className="block text-theme-secondary font-bold mb-2">Inner Layout</label>
                <input
                  type="text"
                  name="innerLayout"
                  value={formData.innerLayout}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-theme-primary"
                />
              </div>
              <div>
                <label className="block text-theme-secondary font-bold mb-2">Switchboard Placement</label>
                <input
                  type="text"
                  name="switchboardPlacement"
                  value={formData.switchboardPlacement}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-theme-primary"
                />
              </div>
              <div>
                <label className="block text-theme-secondary font-bold mb-2">False Ceiling Status</label>
                <input
                  type="text"
                  name="falseCeilingStatus"
                  value={formData.falseCeilingStatus}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-theme-primary"
                />
              </div>
            </>
          )}
          {/* Page 5: Contact Information */}
          {page === 5 && (
            <>
            <h2>Contact Information</h2>
            <p>so that you can login and view the saved details later</p>
              <div>
                <label className="block text-theme-secondary font-bold mb-2">Name</label>
                <input
                  type="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-theme-primary"
                />
              </div>
              <div>
                <label className="block text-theme-secondary font-bold mb-2">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  maxLength={10}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-theme-primary"
                />
              </div>
            </>
          )}

           {/* Navigation buttons */}
           <div className="flex justify-between items-center">
              {/* Previous Button */}
              {page > 1 ? (
                <CTAButton type="button" text="Previous" onClick={handlePrevious} />
              ) : (
                (<div></div>) // Placeholder to keep space between buttons even if Previous isn't rendered
              )}

              {/* Next and Skip Buttons */}
              <div className="flex space-x-4">
                {/* Skip Button for pages 3 and 4 */}
                {page === 2 ||page === 3 || page === 4 ? (
                  <CTAButton
                    type="button"
                    text="Skip"
                    onClick={handleSkip}
                    className="bg-gray-300 text-gray-600 hover:bg-gray-400" // Lighter, less prominent styling for Skip
                  />
                ) : null}

                {/* Next or Submit Button */}
                <CTAButton type="submit" text={page === TOTAL_PAGES ? "Submit" : "Next"} />
              </div>
            </div>
        </form>
      </div>
    </div>
  );
};

export default DesignerQuestionnaire;
