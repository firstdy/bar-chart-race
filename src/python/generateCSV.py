import pycountry
import requests
import pandas as pd
import os


# Load the uploaded file to inspect its contents

# ลองใช้เครื่องหมายคั่นที่เป็น ';' (หากไฟล์ใช้คั่นนี้) และข้ามแถวที่ผิดพลาด
data = pd.read_csv('c:/first/nextjs/sgn-chart/src/python/population.csv', on_bad_lines='warn')

# Display the first few rows of the data to understand its structure
data.head()

# Function to get region based on country name
def get_region_detailed(country_name):
    country = pycountry.countries.get(name=country_name)
    if country:
        # Asia
        if country.name in [
            "Afghanistan", "Armenia", "Azerbaijan", "Bahrain", "Bangladesh", "Bhutan", 
            "Brunei", "Cambodia", "China", "Cyprus", "Georgia", "India", "Indonesia", 
            "Iran", "Iraq", "Israel", "Japan", "Jordan", "Kazakhstan", "Kuwait", "Kyrgyzstan", 
            "Laos", "Lebanon", "Malaysia", "Maldives", "Mongolia", "Myanmar", "Nepal", "North Korea", 
            "Oman", "Pakistan", "Palestine", "Philippines", "Qatar", "Russia", "Saudi Arabia", 
            "Singapore", "South Korea", "Sri Lanka", "Syria", "Tajikistan", "Thailand", "Timor-Leste", 
            "Turkey", "Turkmenistan", "United Arab Emirates", "Uzbekistan", "Vietnam", "Yemen"
        ]:
            return "Asia"
        
        # North America
        elif country.name in ["United States", "Canada", "Mexico"]:
            return "North America"
        
        # Europe
        elif country.name in [
            "Albania", "Andorra", "Armenia", "Austria", "Azerbaijan", "Belarus", "Belgium", 
            "Bosnia and Herzegovina", "Bulgaria", "Croatia", "Cyprus", "Czech Republic", "Denmark", 
            "Estonia", "Finland", "France", "Georgia", "Germany", "Greece", "Hungary", "Iceland", 
            "Ireland", "Italy", "Kazakhstan", "Kosovo", "Latvia", "Liechtenstein", "Lithuania", 
            "Luxembourg", "Malta", "Moldova", "Monaco", "Montenegro", "Netherlands", "North Macedonia", 
            "Norway", "Poland", "Portugal", "Romania", "Russia", "San Marino", "Serbia", "Slovakia", 
            "Slovenia", "Spain", "Sweden", "Switzerland", "Ukraine", "United Kingdom", "Vatican City"
        ]:
            return "Europe"
        
        # South America
        elif country.name in [
            "Argentina", "Bolivia", "Brazil", "Chile", "Colombia", "Ecuador", "Guyana", "Paraguay", 
            "Peru", "Suriname", "Uruguay", "Venezuela"
        ]:
            return "South America"
        
        # Africa
        elif country.name in [
            "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cabo Verde", 
            "Cameroon", "Central African Republic", "Chad", "Comoros", "Congo", "Democratic Republic of the Congo", 
            "Djibouti", "Egypt", "Equatorial Guinea", "Eritrea", "Eswatini", "Ethiopia", "Gabon", "Gambia", 
            "Ghana", "Guinea", "Guinea-Bissau", "Ivory Coast", "Kenya", "Lesotho", "Liberia", "Libya", 
            "Madagascar", "Malawi", "Mali", "Mauritania", "Mauritius", "Morocco", "Mozambique", "Namibia", 
            "Niger", "Nigeria", "Rwanda", "São Tomé and Príncipe", "Senegal", "Seychelles", "Sierra Leone", 
            "Somalia", "South Africa","Africa (UN)", "South Sudan", "Sudan", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe"
        ]:
            return "Africa"
        
        # Oceania
        elif country.name in ["Australia", "Fiji", "Kiribati", "Marshall Islands", "Micronesia", 
                               "Nauru", "New Zealand", "Palau", "Papua New Guinea", "Samoa", "Solomon Islands", 
                               "Tonga", "Tuvalu", "Vanuatu"]:
            return "Oceania"
        
        else:
            return "Other"
    return "Unknown"

# Apply this function to your data
data['region'] = data['Entity'].apply(get_region_detailed)

# Function to get flag URL based on country name
def get_flag(country_name):
    country = pycountry.countries.get(name=country_name)
    if country:
        # Example flag URL - using country alpha_2 code
        return f"https://flagpedia.net/data/flags/h80/{country.alpha_2.lower()}.png"
    return "Unknown"

print(data.head())
