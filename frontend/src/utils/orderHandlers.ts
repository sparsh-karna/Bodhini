// utils/orderHandlers.ts
import { Message } from '../types'; // Adjust the import path as needed

export const handleOrderMessage = async (
  messageText: string,
  collectingOrderDetails: boolean,
  setCollectingOrderDetails: (value: boolean) => void,
  setMessages: (callback: (prev: Message[]) => Message[]) => void,
  setRequiredFields: (fields: any[]) => void,
  requiredFields: any[],
  setCurrentField: (field: any) => void,
  currentField: any,
  setOrderDetails: (details: Record<string, string>) => void,
  orderDetails: Record<string, string>,
  sessionId: string | null
) => {
  if (!collectingOrderDetails) {
    // First message - get required fields
    try {
      const response = await fetch('http://localhost:5001/automate-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      setRequiredFields(data.required_fields);
      setCollectingOrderDetails(true);
      setCurrentField(data.required_fields[0]);

      // Add bot message showing security note and first required field
      const botMessage: Message = {
        id: Date.now(),
        text: `${data.security_note}\n\nPlease provide your ${data.required_fields[0].description}:`,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error starting order process:', error);
    }
  } else {
    // Save the current field's value
    if (currentField) {
      const updatedDetails = {
        ...orderDetails,
        [currentField.field]: messageText,
      };
      setOrderDetails(updatedDetails);

      // Find next required field
      const currentIndex = requiredFields.findIndex(
        (field) => field.field === currentField.field
      );
      const nextField = requiredFields[currentIndex + 1];

      if (nextField) {
        // Ask for next field
        setCurrentField(nextField);
        const botMessage: Message = {
          id: Date.now(),
          text: `Please provide your ${nextField.description}:`,
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        // All fields collected, start automation
        setCollectingOrderDetails(false);
        setCurrentField(null);

        const confirmMessage: Message = {
          id: Date.now(),
          text: 'I have all the required details. Starting the order automation process...',
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, confirmMessage]);

        try {
          const response = await fetch('http://localhost:5001/automate-order', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ orderDetails: updatedDetails }),
          });

          const data = await response.json();

          const botMessage: Message = {
            id: Date.now(),
            text: data.message,
            sender: 'bot',
            timestamp: new Date(),
          };

          setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
          console.error('Error in order automation:', error);
          const errorMessage: Message = {
            id: Date.now() + 1,
            text: 'Sorry, there was an error processing your order. Please try again later.',
            sender: 'bot',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        }

        // Reset states
        setOrderDetails({});
        setRequiredFields([]);
      }
    }
  }
};