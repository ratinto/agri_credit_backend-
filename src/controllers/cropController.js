const supabase = require('../config/supabase');

/**
 * @route   POST /api/v1/crop/add
 * @desc    Add a new crop to a farm
 * @access  Public (should be protected in production)
 */
exports.addCrop = async (req, res) => {
    try {
        const {
            farm_id,
            crop_type,
            season,
            sowing_date,
            expected_harvest_date,
            area_acres,
            expected_yield_qtl
        } = req.body;

        // Validation: Check if required fields are provided
        if (!farm_id || !crop_type || !season || !sowing_date) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'farm_id, crop_type, season, and sowing_date are required'
            });
        }

        // Validate season
        const validSeasons = ['Kharif', 'Rabi', 'Zaid', 'Summer', 'Winter'];
        if (!validSeasons.includes(season)) {
            return res.status(400).json({
                error: 'Invalid season',
                message: `Season must be one of: ${validSeasons.join(', ')}`
            });
        }

        // Validate date format
        const sowingDate = new Date(sowing_date);
        if (isNaN(sowingDate.getTime())) {
            return res.status(400).json({
                error: 'Invalid sowing date',
                message: 'sowing_date must be a valid date (YYYY-MM-DD)'
            });
        }

        // Validate harvest date if provided
        if (expected_harvest_date) {
            const harvestDate = new Date(expected_harvest_date);
            if (isNaN(harvestDate.getTime())) {
                return res.status(400).json({
                    error: 'Invalid harvest date',
                    message: 'expected_harvest_date must be a valid date (YYYY-MM-DD)'
                });
            }

            // Harvest date should be after sowing date
            if (harvestDate <= sowingDate) {
                return res.status(400).json({
                    error: 'Invalid harvest date',
                    message: 'expected_harvest_date must be after sowing_date'
                });
            }
        }

        // Validate area if provided
        if (area_acres && (isNaN(area_acres) || parseFloat(area_acres) <= 0)) {
            return res.status(400).json({
                error: 'Invalid area',
                message: 'area_acres must be a positive number'
            });
        }

        // Validate expected yield if provided
        if (expected_yield_qtl && (isNaN(expected_yield_qtl) || parseFloat(expected_yield_qtl) < 0)) {
            return res.status(400).json({
                error: 'Invalid expected yield',
                message: 'expected_yield_qtl must be a non-negative number'
            });
        }

        // Check if farm exists
        const { data: farm, error: farmError } = await supabase
            .from('farms')
            .select('farm_id, farmer_id, land_size_acres, state, district')
            .eq('farm_id', farm_id)
            .single();

        if (farmError || !farm) {
            return res.status(404).json({
                error: 'Farm not found',
                message: `No farm found with ID: ${farm_id}`
            });
        }

        // Validate area doesn't exceed farm size
        if (area_acres && parseFloat(area_acres) > parseFloat(farm.land_size_acres)) {
            return res.status(400).json({
                error: 'Area exceeds farm size',
                message: `Crop area (${area_acres} acres) cannot exceed farm size (${farm.land_size_acres} acres)`
            });
        }

        // Generate unique crop_id
        const { data: seqData } = await supabase
            .rpc('get_next_crop_id');
        
        let crop_id;
        if (seqData) {
            crop_id = `CROP${seqData}`;
        } else {
            // Fallback: generate from timestamp if sequence fails
            crop_id = `CROP${Date.now().toString().slice(-6)}`;
        }

        // Insert crop into database
        const { data: newCrop, error: insertError } = await supabase
            .from('crops')
            .insert([{
                crop_id,
                farm_id,
                crop_type,
                season,
                sowing_date,
                expected_harvest_date: expected_harvest_date || null,
                area_acres: area_acres ? parseFloat(area_acres) : null,
                expected_yield_qtl: expected_yield_qtl ? parseFloat(expected_yield_qtl) : null,
                crop_status: 'growing'
            }])
            .select()
            .single();

        if (insertError) {
            console.error('Insert Error:', insertError);
            throw insertError;
        }

        // Return success response
        return res.status(201).json({
            message: 'Crop added successfully',
            crop_id: newCrop.crop_id,
            farm_id: newCrop.farm_id,
            crop_type: newCrop.crop_type,
            season: newCrop.season,
            sowing_date: newCrop.sowing_date,
            location: {
                state: farm.state,
                district: farm.district
            }
        });

    } catch (error) {
        console.error('Add Crop Error:', error);
        return res.status(500).json({
            error: 'Failed to add crop',
            message: error.message
        });
    }
};

/**
 * @route   GET /api/v1/crop/:farm_id
 * @desc    Get all crops for a farm
 * @access  Public
 */
exports.getCropsByFarm = async (req, res) => {
    try {
        const { farm_id } = req.params;

        if (!farm_id) {
            return res.status(400).json({
                error: 'Missing farm_id',
                message: 'farm_id is required'
            });
        }

        // Get all crops for the farm
        const { data: crops, error } = await supabase
            .from('crops')
            .select('*')
            .eq('farm_id', farm_id)
            .order('sowing_date', { ascending: false });

        if (error) {
            throw error;
        }

        return res.status(200).json({
            farm_id,
            total_crops: crops.length,
            crops
        });

    } catch (error) {
        console.error('Get Crops Error:', error);
        return res.status(500).json({
            error: 'Failed to fetch crops',
            message: error.message
        });
    }
};

/**
 * @route   GET /api/v1/crop/details/:crop_id
 * @desc    Get details of a specific crop
 * @access  Public
 */
exports.getCropDetails = async (req, res) => {
    try {
        const { crop_id } = req.params;

        if (!crop_id) {
            return res.status(400).json({
                error: 'Missing crop_id',
                message: 'crop_id is required'
            });
        }

        // Get crop details with farm and farmer information
        const { data: crop, error } = await supabase
            .from('crops')
            .select(`
                *,
                farms:farm_id (
                    farm_id,
                    farmer_id,
                    land_size_acres,
                    state,
                    district,
                    village,
                    irrigation_type,
                    soil_type,
                    farmers:farmer_id (
                        farmer_id,
                        full_name,
                        mobile_number
                    )
                )
            `)
            .eq('crop_id', crop_id)
            .single();

        if (error || !crop) {
            return res.status(404).json({
                error: 'Crop not found',
                message: `No crop found with ID: ${crop_id}`
            });
        }

        return res.status(200).json({
            crop
        });

    } catch (error) {
        console.error('Get Crop Details Error:', error);
        return res.status(500).json({
            error: 'Failed to fetch crop details',
            message: error.message
        });
    }
};

/**
 * @route   PUT /api/v1/crop/update/:crop_id
 * @desc    Update crop status or harvest information
 * @access  Public
 */
exports.updateCrop = async (req, res) => {
    try {
        const { crop_id } = req.params;
        const {
            crop_status,
            actual_harvest_date,
            actual_yield_qtl
        } = req.body;

        if (!crop_id) {
            return res.status(400).json({
                error: 'Missing crop_id',
                message: 'crop_id is required'
            });
        }

        // Validate crop status if provided
        const validStatuses = ['growing', 'harvested', 'failed', 'damaged'];
        if (crop_status && !validStatuses.includes(crop_status)) {
            return res.status(400).json({
                error: 'Invalid crop status',
                message: `crop_status must be one of: ${validStatuses.join(', ')}`
            });
        }

        // Build update object
        const updateData = {};
        if (crop_status) updateData.crop_status = crop_status;
        if (actual_harvest_date) updateData.actual_harvest_date = actual_harvest_date;
        if (actual_yield_qtl) updateData.actual_yield_qtl = parseFloat(actual_yield_qtl);

        // Update crop
        const { data: updatedCrop, error } = await supabase
            .from('crops')
            .update(updateData)
            .eq('crop_id', crop_id)
            .select()
            .single();

        if (error || !updatedCrop) {
            return res.status(404).json({
                error: 'Crop not found',
                message: `No crop found with ID: ${crop_id}`
            });
        }

        return res.status(200).json({
            message: 'Crop updated successfully',
            crop: updatedCrop
        });

    } catch (error) {
        console.error('Update Crop Error:', error);
        return res.status(500).json({
            error: 'Failed to update crop',
            message: error.message
        });
    }
};
