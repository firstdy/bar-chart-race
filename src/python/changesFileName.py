import pandas as pd

# Load both population and population-test CSV files
population_file_path = '/public/population.csv'
population_test_file_path = '/public/population-test.csv'

# Read both CSV files
population_df = pd.read_csv(population_file_path)
population_test_df = pd.read_csv(population_test_file_path)

# Display the first few rows of both to compare their structures
population_df.head(), population_test_df.head()
# Rename columns to match population-test.csv
population_df.rename(columns={
    'Country name': 'Entity',
    'Year': 'Year',
    'Population': 'all years'
}, inplace=True)

# Keep only the necessary columns for compatibility
population_df = population_df[['Entity', 'Year', 'all years']]

# Save the cleaned file back to CSV
population_df.to_csv('/mnt/data/cleaned_population.csv', index=False)
