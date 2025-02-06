# agents.py
from langchain_google_genai import ChatGoogleGenerativeAI
from browser_use.agent.service import Agent
from browser_use.browser.browser import Browser, BrowserConfig, BrowserContextConfig
import asyncio
import os
from dotenv import load_dotenv
from typing import List, Dict, Any
from dataclasses import dataclass

@dataclass
class SubTask:
    description: str
    requires_input: bool = False
    input_type: str = None
    options: List[str] = None
    validation_rules: Dict[str, Any] = None

class BaseAgent:
    def __init__(self, browser, llm):
        self.browser = browser
        self.llm = llm
        
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError("Subclasses must implement execute")

class FormFieldAgent(BaseAgent):
    """Agent responsible for finding and interacting with form fields"""
    
    async def find_field(self, field_name: str) -> bool:
        task = f"""
        Find the form field labeled or related to '{field_name}'.
        Verify that the field is visible and interactive.
        Return the status of the field location.
        """
        agent = Agent(task=task, llm=self.llm, browser=self.browser)
        result = await agent.run(max_steps=5)
        return result.success

    async def input_text(self, field_name: str, value: str) -> bool:
        task = f"""
        Input the text '{value}' into the field related to '{field_name}'.
        Verify that the text was successfully entered.
        """
        agent = Agent(task=task, llm=self.llm, browser=self.browser)
        result = await agent.run(max_steps=5)
        return result.success

class DropdownAgent(BaseAgent):
    """Agent responsible for handling dropdown selections"""
    
    async def get_options(self, dropdown_name: str) -> List[str]:
        task = f"""
        Find the dropdown labeled '{dropdown_name}'.
        Click to open the dropdown.
        Extract and return all available options.
        """
        agent = Agent(task=task, llm=self.llm, browser=self.browser)
        result = await agent.run(max_steps=5)
        # Parse results to extract options
        return result.extracted_options

    async def select_option(self, dropdown_name: str, option: str) -> bool:
        task = f"""
        Find the dropdown labeled '{dropdown_name}'.
        Select the option '{option}' from the dropdown.
        Verify that the selection was successful.
        """
        agent = Agent(task=task, llm=self.llm, browser=self.browser)
        result = await agent.run(max_steps=5)
        return result.success

class NavigationAgent(BaseAgent):
    """Agent responsible for page navigation and button clicks"""
    
    async def click_button(self, button_name: str) -> bool:
        task = f"""
        Find and click the button labeled '{button_name}'.
        Verify that the click was successful and any expected navigation occurred.
        """
        agent = Agent(task=task, llm=self.llm, browser=self.browser)
        result = await agent.run(max_steps=5)
        return result.success
    
    async def navigate_to_page(self, page_url: str) -> bool:
        task = f"""
        Navigate to the page at URL '{page_url}'.
        Verify that the page was successfully loaded.
        """
        agent = Agent(task=task, llm=self.llm, browser=self.browser)
        result = await agent.run(max_steps=5)
        return result.success

class AadhaarAutomationOrchestrator:
    def __init__(self):
        self.browser = Browser(
            config=BrowserConfig(
                headless=False,
                disable_security=True,
                new_context_config=BrowserContextConfig(
                    disable_security=True,
                    minimum_wait_page_load_time=1,
                    maximum_wait_page_load_time=10,
                    browser_window_size={'width': 1280, 'height': 1100},
                ),
            )
        )
        
        load_dotenv()
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash", 
            api_key=os.getenv("GENAI_API_KEY")
        )
        
        # Initialize sub-agents
        self.form_agent = FormFieldAgent(self.browser, self.llm)
        self.dropdown_agent = DropdownAgent(self.browser, self.llm)
        self.navigation_agent = NavigationAgent(self.browser, self.llm)
        
    async def handle_user_input(self, prompt: str, options: List[str] = None) -> str:
        """Request and handle user input"""
        print(f"\n{prompt}")
        if options:
            print("Available options:")
            for i, option in enumerate(options, 1):
                print(f"{i}. {option}")
        return input("> ")

    async def execute_form_step(self, field_name: str, requires_input: bool = True) -> bool:
        """Execute a single form field step"""
        print(f"\nLocating {field_name} field...")
        field_found = await self.form_agent.find_field(field_name)
        
        if not field_found:
            print(f"Failed to find {field_name} field")
            return False
            
        if requires_input:
            user_input = await self.handle_user_input(f"Please enter {field_name}:")
            print(f"Inputting {field_name}...")
            return await self.form_agent.input_text(field_name, user_input)
        return True

    async def execute_dropdown_step(self, dropdown_name: str) -> bool:
        """Execute a single dropdown selection step"""
        print(f"\nGetting options for {dropdown_name}...")
        options = await self.dropdown_agent.get_options(dropdown_name)
        
        if not options:
            print(f"No options found for {dropdown_name}")
            return False
            
        user_choice = await self.handle_user_input(
            f"Please select {dropdown_name}:",
            options=options
        )
        
        print(f"Selecting {user_choice} for {dropdown_name}...")
        return await self.dropdown_agent.select_option(dropdown_name, user_choice)

    async def run_automation(self):
        """Main automation flow"""
        try:
            print("Starting Aadhaar card application automation...")
            
            await self.navigation_agent.navigate_to_page("https://ask1.uidai.gov.in/Enrollment/ASKLoad")
            
            # Navigate to initial page
            print("\nNavigating to New Aadhaar option...")
            await self.navigation_agent.click_button("New Adhaar")
            
            # Mobile number input
            await self.execute_form_step("mobile number")
            
            # Captcha handling
            await self.execute_form_step("captcha")
            print("\nGenerating OTP...")
            await self.navigation_agent.click_button("Generate OTP")
            
            # OTP verification
            await self.execute_form_step("OTP")
            print("\nVerifying OTP...")
            await self.navigation_agent.click_button("Verify OTP")
            
            # Personal details
            print("\nFilling personal details...")
            await self.execute_dropdown_step("State")
            await self.execute_dropdown_step("City")
            await self.execute_dropdown_step("Aadhaar Seva Kendra")
            
            print("\nMoving to next section...")
            await self.navigation_agent.click_button("Next")
            
            # More personal details
            print("\nFilling additional details...")
            await self.execute_form_step("name")
            await self.execute_dropdown_step("Identity Proof")
            await self.execute_dropdown_step("Gender")
            await self.execute_form_step("Email ID")
            
            # Address details
            print("\nFilling address details...")
            await self.execute_form_step("Pincode")
            await self.execute_dropdown_step("City")
            await self.execute_dropdown_step("Post Office")
            
            # Final steps
            print("\nProceeding to appointment selection...")
            await self.navigation_agent.click_button("Next")
            await self.execute_dropdown_step("Appointment Date")
            await self.execute_dropdown_step("Time Slot")
            
            print("\nSubmitting application...")
            await self.navigation_agent.click_button("Submit")
            
            print("\nAutomation completed successfully!")
            return True
            
        except Exception as e:
            print(f"\nError during automation: {str(e)}")
            return False

async def main():
    orchestrator = AadhaarAutomationOrchestrator()
    await orchestrator.run_automation()

if __name__ == '__main__':
    asyncio.run(main())