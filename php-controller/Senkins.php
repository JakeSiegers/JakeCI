<?php
    require_once($_SERVER['DOCUMENT_ROOT'].'/inc/php/FweBaseController.php');

    class Senkins extends FweBaseController{
        private $data;
        private $appPath;
        private $controllerPath;
        private $defaultDataStructure;

        function __construct(){
            $this->initController();

            $this->jsonErrorOutput = true;
            $this->appPath = $_SERVER['DOCUMENT_ROOT'].'/Senkins/';
            $this->controllerPath = $this->appPath.'php-controller/';
            $this->defaultDataStructure = array(
                'jobs' => array(),
                'settings' => array()
            );

            $this->initData();
        }

        function initData(){


            $dataFieLocation = $this->controllerPath."data.php";
            if(!file_exists($dataFieLocation)){
                $jsonData = json_encode($this->defaultDataStructure);
                file_put_contents($dataFieLocation,'<?php $data = '.var_export($jsonData,true).';');
            }
            require_once($dataFieLocation);
            $this->data = json_decode($data,true);
        }

        function getAllJobs(){
            $this->outputJson($this->data['jobs']);
        }

        function addJob(){
            $params = $this->checkPostParams(array(
                'name' => array('required' => true),
                'description',
                'exec',
            ));
        }

        private function checkPostParams($params){
            $values = array();
            foreach($params as $param => $paramOptions){
                $errors = array();
                if(!isset($_POST[$param]) || trim($_POST[$param]) == ''){
                    if(isset($paramOptions['required']) && $paramOptions['required'] === true){
                        $errors[] = $param.' is required';
                    }
                    $values[$param] = '';
                }else{
                    $values[$param] = trim($_POST[$param]);
                }
                if(count($errors)>0){
                    throw new FweUserMessageException(implode('\r\n',$errors));
                }
            }
            return $values;
        }
    }